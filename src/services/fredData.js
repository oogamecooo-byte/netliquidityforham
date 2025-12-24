import axios from 'axios';

const BASE_URL = '/api/fred/series/observations';
const API_KEY = import.meta.env.VITE_FRED_API_KEY;

const fetchSeries = async (seriesId) => {
  try {
    const params = {
      series_id: seriesId,
      api_key: API_KEY,
      file_type: 'json',
    };

    // Adjust frequency and aggregation based on series
    if (seriesId === 'MMMFFAQ027S' || seriesId === 'GDP') {
      params.frequency = 'q'; // Quarterly
      // No aggregation needed for native quarterly
    } else {
      params.frequency = 'w'; // Weekly
      params.aggregation_method = 'eop'; // End of Period (for Daily -> Weekly)
    }

    const response = await axios.get(`${BASE_URL}`, { params });
    console.log(`Fetched ${seriesId}:`, response.data.observations?.length || 0, 'items');
    return response.data.observations;
  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error);
    return [];
  }
};

export const getLiquidityData = async () => {
  if (!API_KEY) {
    console.error("FRED API Key is missing!");
    return [];
  }

  // Fetch all required series
  // WALCL: Fed Total Assets (Weekly - Wednesday)
  // WTREGEN: Treasury General Account (Weekly - Wednesday Level)
  // RRPONTSYD: Overnight Reverse Repo (Daily - we will use Wednesday values)
  // MMMFFAQ027S: Total Money Market Funds (Quarterly)
  // WRMFNS: Retail Money Market Funds (Weekly)
  // GDP: Gross Domestic Product (Quarterly)
  // WRESBAL: Reserve Balances with Federal Reserve Banks (Weekly)

  const [fedAssets, tga, rrp, mmfTotal, mmfRetail, gdpData, reserves] = await Promise.all([
    fetchSeries('WALCL'),
    fetchSeries('WTREGEN'),
    fetchSeries('RRPONTSYD'),
    fetchSeries('MMMFFAQ027S'),
    fetchSeries('WRMFNS'),
    fetchSeries('GDP'),
    fetchSeries('WRESBAL')
  ]);

  // Process and align data
  // We'll use the dates from Fed Assets (WALCL) as the base (Wednesdays)
  const processedData = fedAssets.map(asset => {
    const date = asset.date;

    const findValue = (series, d) => {
      // Try to find exact date match
      let item = series.find(i => i.date === d);

      // If not found (e.g. MMF is Monday, RRP might be missing on holiday), find closest previous date
      if (!item) {
        const targetDate = new Date(d);
        // Look back up to 7 days (cover a full week)
        for (let i = 1; i <= 7; i++) {
          const prevDate = new Date(targetDate);
          prevDate.setDate(targetDate.getDate() - i);
          const dateStr = prevDate.toISOString().split('T')[0];
          item = series.find(i => i.date === dateStr);
          if (item) break;
        }
      }
      return item ? parseFloat(item.value) : null;
    };

    // Find GDP Value (Quarterly)
    // Use the latest available GDP value for the given date
    const findGdpValue = (d) => {
      if (!gdpData) return null;
      const targetDate = new Date(d);
      const sorted = [...gdpData].sort((a, b) => new Date(b.date) - new Date(a.date));
      const item = sorted.find(i => new Date(i.date) <= targetDate);
      return item ? parseFloat(item.value) : null;
    };

    const findMmfValue = (d) => {
      const targetDate = new Date(d);
      const sorted = [...mmfTotal].sort((a, b) => new Date(b.date) - new Date(a.date));
      const item = sorted.find(i => new Date(i.date) <= targetDate);
      return item ? parseFloat(item.value) : 0;
    };

    // Units:
    // WALCL: Millions
    // WTREGEN: Millions
    // RRPONTSYD: Billions
    // MMMFFAQ027S: Millions
    // GDP: Billions
    // WRESBAL: Billions

    const fedAssetsMillions = parseFloat(asset.value);
    const fedAssetsBillions = fedAssetsMillions / 1000;

    const tgaMillions = findValue(tga, date) || 0;
    const tgaBillions = tgaMillions / 1000;

    const rrpBillions = findValue(rrp, date) || 0;

    const mmfMillions = findMmfValue(date);
    const mmfBillions = mmfMillions / 1000;

    const gdpBillions = findGdpValue(date);

    const reservesMillions = findValue(reserves, date) || 0;
    const reservesBillions = reservesMillions / 1000;

    // Net Liquidity Formula: Fed Assets - TGA - RRP
    const netLiquidityBillions = fedAssetsBillions - tgaBillions - rrpBillions;

    // Net Liquidity / GDP Ratio
    // GDP is in Billions, Net Liquidity is in Billions. Ratio is percentage.
    const liquidityToGdpRatio = gdpBillions ? (netLiquidityBillions / gdpBillions) * 100 : null;

    // Reserves / GDP Ratio
    const reservesToGdpRatio = gdpBillions ? (reservesBillions / gdpBillions) * 100 : null;

    return {
      date,
      fedAssets: fedAssetsBillions / 1000, // Trillions
      tga: tgaBillions / 1000, // Trillions
      rrp: rrpBillions / 1000, // Trillions
      mmf: mmfBillions / 1000, // Trillions
      netLiquidity: netLiquidityBillions / 1000, // Trillions
      liquidityToGdpRatio: liquidityToGdpRatio, // Percentage
      reservesToGdpRatio: reservesToGdpRatio, // Percentage

      // Raw values for delta calculation (Billions)
      raw: {
        fedAssets: fedAssetsBillions,
        tga: tgaBillions,
        rrp: rrpBillions,
        mmf: mmfBillions,
        netLiquidity: netLiquidityBillions,
        gdp: gdpBillions,
        reserves: reservesBillions
      }
    };
  });

  // Debug logging for units (Check the last item)
  const lastItem = processedData[processedData.length - 1];
  if (lastItem) {
    console.log(`Date: ${lastItem.date}`);
    console.log(`GDP (Billions?): ${lastItem.raw.gdp}`);
    console.log(`Reserves (Billions?): ${lastItem.raw.reserves}`);
    console.log(`Ratio: ${lastItem.reservesToGdpRatio}`);
  }

  // Calculate Weekly Changes
  for (let i = 1; i < processedData.length; i++) {
    const curr = processedData[i];
    const prev = processedData[i - 1];

    curr.delta = {
      fedAssets: curr.raw.fedAssets - prev.raw.fedAssets,
      tga: curr.raw.tga - prev.raw.tga,
      rrp: curr.raw.rrp - prev.raw.rrp,
      netLiquidity: curr.raw.netLiquidity - prev.raw.netLiquidity,
      reserves: curr.raw.reserves - prev.raw.reserves,

      // MMF Change
      mmf: curr.raw.mmf - prev.raw.mmf,

      // MMF Flow Logic (User Specified)
      // Flow = (MMF Total - RRP Balance)
      // This is a STOCK value being treated as a FLOW indicator.
      mmfToMarketFlow: (curr.raw.mmf - curr.raw.rrp)
    };
  }

  return processedData.filter(d => d.delta); // Remove first item without delta
};
