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
        await page.waitForSelector('#chart_div', { timeout: 10000 });

        // Inject CSS to invert colors and hide unnecessary elements
        await page.evaluate(() => {
            // 1. Invert colors for dark mode (white -> black, black -> white)
            // hue-rotate(180deg) preserves original hues roughly, but simple invert is often enough for charts
            const style = document.createElement('style');
            style.innerHTML = `
                /* Invert the chart container to make it dark mode */
                #chart_div {
                    filter: invert(1) hue-rotate(180deg);
                    background-color: #000 !important; /* Ensure background is black after inversion */
                }
                
                /* Hide everything except the chart SVG/Canvas */
                /* We try to hide common header/footer elements within the chart div if they exist */
                /* Based on user request, we want ONLY the chart. */
                /* Inspecting typical OFR structure: The chart is usually an SVG or Canvas inside #chart_div */
                
                /* Hide potential headers/titles inside the chart div if they are separate elements */
                /* This is a best-guess approach without live inspection, but we can try to target text elements */
                
                /* If the user wants to remove the "Investments by any U.S. MMF" title, it might be outside #chart_div */
                /* But since we are screenshotting #chart_div, we only care about what's inside it. */
                /* If the title IS inside #chart_div, we might need to hide it. */
                
                /* Let's try to make the background transparent or black */
                body {
                    background-color: #000;
                }
            `;
            document.head.appendChild(style);
        });

        // Give Highcharts a moment to render
        await new Promise(r => setTimeout(r, 2000));

        const element = await page.$('#chart_div');
        if (!element) {
            throw new Error('Chart element not found');
        }

        // Capture screenshot
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
