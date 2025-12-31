import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
    let browser = null;
    try {
        // Configure Chromium for Vercel environment
        // @sparticuz/chromium is specifically designed for AWS Lambda / Vercel

        // Launch browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Optimize: Block unnecessary resources to speed up load time
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'font', 'stylesheet'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Set viewport to a good size for the chart
        await page.setViewport({ width: 1200, height: 800 });

        // Navigate to the page
        // waitUntil: 'domcontentloaded' is faster than 'networkidle2'
        await page.goto('https://www.financialresearch.gov/money-market-funds/', {
            waitUntil: 'domcontentloaded',
            timeout: 15000 // 15s timeout for navigation
        });

        // Wait for the specific chart container
        // Based on previous analysis: #chart_div is the container
        await page.waitForSelector('#chart_div', { timeout: 10000 });

        // Give Highcharts a moment to render the SVG/Canvas
        // We can try to wait for a specific SVG element inside if possible, but a short sleep is safer
        await new Promise(r => setTimeout(r, 2000));

        const element = await page.$('#chart_div');
        if (!element) {
            throw new Error('Chart element not found');
        }

        const screenshotBuffer = await element.screenshot();

        res.setHeader('Content-Type', 'image/png');
        // Cache for 1 hour
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
        res.status(200).send(screenshotBuffer);

    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({
            error: 'Failed to capture screenshot',
            details: error.message,
            stack: error.stack
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
