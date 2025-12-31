import axios from 'axios';

const API_KEY = '6388f92d75138ccd09f8e636adb106c1';
const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

const fetchSeries = async (seriesId) => {
    try {
        const params = {
            series_id: seriesId,
            api_key: API_KEY,
            file_type: 'json',
            observation_start: '2000-01-01',
        };

        if (seriesId === 'MMMFFAQ027S' || seriesId === 'GDP' || seriesId === 'IRLTLT01JPM156N') {
            params.frequency = 'm';
            if (seriesId === 'MMMFFAQ027S' || seriesId === 'GDP') params.frequency = 'q';
        } else {
            params.frequency = 'w';
            params.aggregation_method = 'eop';
        }

        const response = await axios.get(BASE_URL, { params });
        console.log(`Fetched ${seriesId}:`, response.data.observations?.length || 0, 'items');
        return response.data.observations;
    } catch (error) {
        console.error(`Error fetching ${seriesId}:`, error.response?.status, error.response?.statusText);
        return [];
    }
};

const runDebug = async () => {
    console.log('Starting debug...');

    const [fedAssets, us10yData, jp10yData, highYieldData] = await Promise.all([
        fetchSeries('WALCL'),
        fetchSeries('DGS10'),
        fetchSeries('IRLTLT01JPM156N'),
        fetchSeries('BAMLH0A0HYM2')
    ]);

    if (!fedAssets || fedAssets.length === 0) {
        console.error('Failed to fetch WALCL. Cannot proceed.');
        return;
    }

    console.log('Processing data...');

    const processedData = fedAssets.map(asset => {
        const date = asset.date;

        const findValue = (series, d) => {
            let item = series.find(i => i.date === d);
            if (!item) {
                const targetDate = new Date(d);
                // Increased lookback to 14 days
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

        const findLatestMonthlyValue = (series, d) => {
            const targetDate = new Date(d);
            for (let i = 0; i <= 100; i++) {
                const prevDate = new Date(targetDate);
                prevDate.setDate(targetDate.getDate() - i);
                const dateStr = prevDate.toISOString().split('T')[0];
                const item = series.find(i => i.date === dateStr);
                if (item) return parseFloat(item.value);
            }
            return null;
        };

        const usVal = findValue(us10yData, date);
        const jpVal = findLatestMonthlyValue(jp10yData, date);
        const highYieldVal = findValue(highYieldData, date);

        return {
            date,
            usVal,
            jpVal,
            highYieldVal,
            usJpSpread: (usVal !== null && jpVal !== null) ? usVal - jpVal : null,
            highYieldSpread: highYieldVal
        };
    });

    const lastItems = processedData.slice(-5);
    console.log('--- Last 5 Processed Items ---');
    lastItems.forEach(item => {
        console.log(`Date: ${item.date}, US10Y: ${item.usVal}, JP10Y: ${item.jpVal}, Spread: ${item.usJpSpread}, HighYield: ${item.highYieldSpread}`);
    });
};

runDebug();
