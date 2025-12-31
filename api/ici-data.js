import axios from 'axios';

export default async function handler(req, res) {
    try {
        const response = await axios.get('https://www.ici.org/mm_summary_data_2025.xls', {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', 'attachment; filename=mm_summary_data_2025.xls');
        res.status(200).send(response.data);
    } catch (error) {
        console.error('Error fetching ICI data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}
