import axios from 'axios';

const BASE_URL = '/api/fred/series/observations';
const API_KEY = import.meta.env.VITE_FRED_API_KEY;

const fetchSeries = async (seriesId) => {
  try {
    const params = {
      series_id: seriesId,
      api_key: API_KEY,
      file_type: 'json',
      observation_start: '2000-01-01', // Ensure we get data from 2000
    };

    // Adjust frequency and aggregation based on series
    if (seriesId === 'MMMFFAQ027S' || seriesId === 'GDP' || seriesId === 'IRLTLT01JPM156N') {
      params.frequency = 'm'; // Monthly (or Quarterly for GDP/MMF, but 'm' is safer for monthly series)
      if (seriesId === 'MMMFFAQ027S' || seriesId === 'GDP') params.frequency = 'q';
      // No aggregation needed for native frequency
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

  const [fedAssets, tga, rrp, mmfTotal, mmfRetail, gdpData, reserves, wilshireData, btcData, us10yData, jp10yData, highYieldData] = await Promise.all([
    fetchSeries('WALCL'),
    fetchSeries('WTREGEN'),
    fetchSeries('RRPONTSYD'),
    fetchSeries('MMMFFAQ027S'),
    fetchSeries('WRMFNS'),
    fetchSeries('GDP'),
    fetchSeries('WRESBAL'),
    fetchSeries('WILL5000INDFC'), // Wilshire 5000 (Total Market)
    fetchSeries('CBBTCUSD'), // Coinbase Bitcoin
    fetchSeries('DGS10'), // US 10Y Yield (Daily)
    fetchSeries('IRLTLT01JPM156N'), // Japan 10Y Yield (Monthly)
    fetchSeries('BAMLH0A0HYM2') // High Yield Spread (Daily)
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
        // Look back up to 14 days (cover holidays and data delays)
        for (let i = 1; i <= 14; i++) {
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

    // Helper to find the latest available monthly value up to the given date
    const findLatestMonthlyValue = (series, d) => {
      const targetDate = new Date(d);
      // Look back up to 100 days to find the last monthly value (generous buffer)
      for (let i = 0; i <= 100; i++) {
        const prevDate = new Date(targetDate);
        prevDate.setDate(targetDate.getDate() - i);
        const dateStr = prevDate.toISOString().split('T')[0];
        const item = series.find(i => i.date === dateStr);
        if (item) return parseFloat(item.value);
      }
      return null;
    };

    return {
      date,
      fedAssets: fedAssetsBillions / 1000, // Trillions
      tga: tgaBillions / 1000, // Trillions
      rrp: rrpBillions / 1000, // Trillions
      mmf: mmfBillions / 1000, // Trillions
      netLiquidity: netLiquidityBillions / 1000, // Trillions
      liquidityToGdpRatio: liquidityToGdpRatio, // Percentage
      reservesToGdpRatio: reservesToGdpRatio, // Percentage
      mmfToGdpRatio: gdpBillions ? (mmfBillions / gdpBillions) * 100 : null, // Percentage
      wilshire: findValue(wilshireData, date), // Wilshire 5000 Index
      btc: findValue(btcData, date), // Bitcoin Price
      usJpSpread: (() => {
        const usVal = findValue(us10yData, date);
        const jpVal = findLatestMonthlyValue(jp10yData, date);
        if (usVal !== null && jpVal !== null) {
          return usVal - jpVal;
        }
        return null;
      })(),
      us10y: findValue(us10yData, date), // US 10Y Yield
      jp10y: findLatestMonthlyValue(jp10yData, date), // Japan 10Y Yield
      highYieldSpread: findValue(highYieldData, date), // High Yield Spread


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

    // Debug US-JP and High Yield
    console.log('--- Debug Spread Data ---');
    console.log(`US 10Y Data Length: ${us10yData?.length}`);
    console.log(`JP 10Y Data Length: ${jp10yData?.length}`);
    console.log(`High Yield Data Length: ${highYieldData?.length}`);
    console.log(`US-JP Spread: ${lastItem.usJpSpread}`);
    console.log(`High Yield Spread: ${lastItem.highYieldSpread}`);

    if (us10yData?.length > 0) console.log('Sample US 10Y:', us10yData[us10yData.length - 1]);
    if (jp10yData?.length > 0) console.log('Sample JP 10Y:', jp10yData[jp10yData.length - 1]);
    if (highYieldData?.length > 0) console.log('Sample High Yield:', highYieldData[highYieldData.length - 1]);
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
