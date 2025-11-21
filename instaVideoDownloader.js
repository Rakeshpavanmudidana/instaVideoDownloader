const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");
const axios = require("axios");
const fs = require("fs");

// Telegram Bot Token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Function to extract video URL using Puppeteer
async function getDownloadUrl(videoUrl) {
    const browser = await puppeteer.launch({
        executablePath: chromium.path,
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer"
        ]
        });


    const page = await browser.newPage();

    await page.goto("https://saveclip.app/en", { waitUntil: "networkidle2" });

    // Enter User Link
    await page.type("input#url", videoUrl);
    await page.click("button[type='submit']");

    // Wait for result
    await page.waitForSelector('a[title="Download Video 1"]', { timeout: 60000 });

    // Extract final URL
    const finalUrl = await page.$eval(
        'a[title="Download Video 1"]',
        el => el.href
    );

    await browser.close();
    return finalUrl;
}

// Download file
async function downloadVideo(url, output) {
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    });

    const writer = fs.createWriteStream(output);
    response.data.pipe(writer);

    return new Promise((resolve) => {
        writer.on("finish", resolve);
    });
}

// Telegram bot listener
bot.on("text", async (ctx) => {
    const userUrl = ctx.message.text;

    // Validate link
    if (!userUrl.includes("instagram.com") && !userUrl.includes("youtu")) {
        return ctx.reply("Send me a valid Instagram/YouTube URL.");
    }

    ctx.reply("Processing… wait 5–10 seconds.");

    try {
        // Get final URL
        const finalUrl = await getDownloadUrl(userUrl);
        ctx.reply("Downloading…");

        const outputFile = "video.mp4";

        // Download the video file
        await downloadVideo(finalUrl, outputFile);

        // Send video to user
        await ctx.replyWithVideo({ source: outputFile });

        // Cleanup
        fs.unlinkSync(outputFile);

    } catch (e) {
        console.log(e);
        ctx.reply("Failed to process the video.");
    }
});

bot.launch();
console.log("🔥 Bot started...");


setInterval(() => {
    console.log("Still Alive: " + new Date());
}, 1000 * 60 * 5);

