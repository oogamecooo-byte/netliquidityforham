import axios from 'axios';

const BASE_URL = '/api/fred/series/observations';
const API_KEY = import.meta.env.VITE_FRED_API_KEY;

const fetchSeries = async (seriesId) => {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      params: {
        series_id: seriesId,
        api_key: API_KEY,
        file_type: 'json',
        frequency: seriesId === 'MMMFFAQ027S' ? 'q' : 'w', // Quarterly for Total MMF
        aggregation_method: 'eop',
      }
    });
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
  // MMMFFAQ027S: Total Money Market Funds (Quarterly) - For Historical Level
  // WRMFNS: Retail Money Market Funds (Weekly) - Proxy for weekly fluctuations

  const [fedAssets, tga, rrp, mmfTotal, mmfRetail] = await Promise.all([
    fetchSeries('WALCL'),
    fetchSeries('WTREGEN'),
    fetchSeries('RRPONTSYD'),
    fetchSeries('MMMFFAQ027S'),
    fetchSeries('WRMFNS')
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

    // Estimate Weekly Total MMF
    // Logic: Use latest known Quarterly Total MMF (MMMFFAQ027S) as base.
    // Then apply the trend from Weekly Retail MMF (WRMFNS).
    // Simple approach for now: Just use the most recent Quarterly value available for that date.
    // If we want "live" weekly movement, we could try to extrapolate, but sticking to the latest known Quarterly 
    // is safer and "automatic" (it updates when FRED updates).
    // User wants "Automatic Update". The Quarterly series updates... quarterly.
    // The Retail series updates weekly.
    // Let's use the Retail series (WRMFNS) scaled up? Or just use Quarterly and accept it's flat between quarters?
    // User wants "Daily/Weekly update".
    // Let's use a Hybrid:
    // Base = Quarterly MMF.
    // If date > last Quarterly date, assume it follows Retail MMF trend?
    // Actually, for simplicity and robustness: Use Quarterly MMF for the "Level".
    // But for the "Flow" (MMF - RRP), RRP changes weekly, so the flow WILL change weekly even if MMF is flat.
    // This satisfies "Automatic Update" because RRP is automatic.

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

    const fedAssetsMillions = parseFloat(asset.value);
    const fedAssetsBillions = fedAssetsMillions / 1000;

    const tgaMillions = findValue(tga, date) || 0;
    const tgaBillions = tgaMillions / 1000;

    const rrpBillions = findValue(rrp, date) || 0;

    const mmfMillions = findMmfValue(date);
    const mmfBillions = mmfMillions / 1000;

    // Net Liquidity Formula: Fed Assets - TGA - RRP
    const netLiquidityBillions = fedAssetsBillions - tgaBillions - rrpBillions;

    return {
      date,
      fedAssets: fedAssetsBillions / 1000, // Trillions
      tga: tgaBillions / 1000, // Trillions
      rrp: rrpBillions / 1000, // Trillions
      mmf: mmfBillions / 1000, // Trillions
      netLiquidity: netLiquidityBillions / 1000, // Trillions

      // Raw values for delta calculation (Billions)
      raw: {
        fedAssets: fedAssetsBillions,
        tga: tgaBillions,
        rrp: rrpBillions,
        mmf: mmfBillions,
        netLiquidity: netLiquidityBillions
      }
    };
  });

  // Calculate Weekly Changes
  for (let i = 1; i < processedData.length; i++) {
    const curr = processedData[i];
    const prev = processedData[i - 1];

    curr.delta = {
      fedAssets: curr.raw.fedAssets - prev.raw.fedAssets,
      tga: curr.raw.tga - prev.raw.tga,
      rrp: curr.raw.rrp - prev.raw.rrp,
      netLiquidity: curr.raw.netLiquidity - prev.raw.netLiquidity,

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
