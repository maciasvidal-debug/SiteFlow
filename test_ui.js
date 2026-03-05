const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

(async () => {
    // Serve the current directory
    const server = http.createServer((request, response) => {
        return handler(request, response, {
            public: path.join(__dirname)
        });
    });

    server.listen(3002, async () => {
        console.log('Running test on http://localhost:3002');

        try {
            const browser = await chromium.launch();
            const context = await browser.newContext();
            const page = await context.newPage();

            // --- Desktop View ---
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.goto('http://localhost:3002/index.html');
            await page.waitForTimeout(1000); // Wait for animations/rendering
            await page.screenshot({ path: 'desktop_ui_test.png', fullPage: true });
            console.log('Desktop view saved.');

            // --- Mobile View ---
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('http://localhost:3002/index.html');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'mobile_ui_test.png', fullPage: true });
            console.log('Mobile view saved.');

            await browser.close();
            console.log('UI Tests completed. Screenshots saved.');
        } catch (error) {
            console.error('Error during testing:', error);
        } finally {
            server.close();
        }
    });
})();
