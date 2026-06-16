const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Serve the frontend UI file directly from the backend server
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The core web scraping automation engine
async function checkGoogleCalendar(url) {
    // Launch browser with a real user-agent string to prevent Google from blocking the headless request
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'en-US'
    });

    try {
        // Navigate to the Google Calendar link
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Give the JavaScript inside Google Calendar a safe 4 seconds to render elements
        await page.waitForTimeout(4000);

        // Evaluate the DOM structure to detect interactive booking items
        const result = await page.evaluate(() => {
            const pageText = document.body.innerText.toLowerCase();

            // Check for explicit 'no slots' layout messages
            if (pageText.includes('no available slots') || pageText.includes('no times available') || pageText.includes('nothing available')) {
                return { status: 'No Slots Found', details: 'Fully Booked' };
            }

            // Look for any standard interactive elements containing a time slot format
            const gridSlots = Array.from(document.querySelectorAll('[role="button"], button')).filter(el => {
                const label = (el.getAttribute('aria-label') || '').toLowerCase();
                const text = el.innerText.toLowerCase();

                const hasTimePattern = /(am|pm|\b\d{1,2}:\d{2}\b)/.test(label || text);
                const isNavButton = label.includes('next') || label.includes('previous') || label.includes('menu');

                return hasTimePattern && !isNavButton;
            });

            if (gridSlots.length > 0) {
                return { status: 'Available', details: `${gridSlots.length} slots visible` };
            }

            return { status: 'No Slots Found', details: 'No active schedule fields detected' };
        });

        await browser.close();
        return { url, status: result.status, details: result.details };

    } catch (error) {
        await browser.close();
        return { url, status: 'Error', details: error.message };
    }
}

// API endpoint that handles checking multiple links consecutively to preserve CPU
app.post('/api/check-slots', async (req, res) => {
    const { links } = req.body;

    if (!links || !Array.isArray(links)) {
        return res.status(400).json({ error: 'Provide an array of calendar URLs.' });
    }

    const results = [];

    // Process links sequentially to avoid crashing your machine's CPU
    for (const url of links) {
        if (url.trim().startsWith('http')) {
            const statusResult = await checkGoogleCalendar(url);
            results.push(statusResult);
        } else {
            results.push({ url, status: 'Invalid Link', details: 'URL must start with http/https' });
        }
    }

    res.json({ success: true, results });
});

// Start the server properly
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Server running successfully!`);
    console.log(`🔗 Access your app interface at: http://localhost:${PORT}`);
    console.log(`===================================================`);
});