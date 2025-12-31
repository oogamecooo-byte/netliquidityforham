import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
    let browser = null;
    try {
        // Optional: Configure font support if needed, but default might work
        // await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Set viewport to a reasonable size for the chart
        await page.setViewport({ width: 1200, height: 800 });

        await page.goto('https://www.financialresearch.gov/money-market-funds/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for the chart container
        await page.waitForSelector('#chart_div', { timeout: 10000 });

        // Wait extra time for Highcharts animation to finish
        await new Promise(r => setTimeout(r, 3000));

        const element = await page.$('#chart_div');
        if (!element) {
            throw new Error('Chart element not found');
        }

        const screenshotBuffer = await element.screenshot();

        res.setHeader('Content-Type', 'image/png');
        // Cache for 1 hour to avoid hitting limits
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
        res.status(200).send(screenshotBuffer);

    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({
            error: 'Failed to capture screenshot',
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
