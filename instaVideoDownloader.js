const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");
const axios = require("axios");
const fs = require("fs");

// Telegram Bot Token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Function to extract video URL using Puppeteer
const axios = require("axios");

async function getDownloadUrl(videoUrl) {
    const options = {
        method: 'GET',
        url: 'https://instagram-downloader.p.rapidapi.com/instagram/',
        params: {url: videoUrl},
        headers: {
            'X-RapidAPI-Key': process.env.RAPID_KEY,
            'X-RapidAPI-Host': process.env.RAPID_HOST
        }
    };

    const response = await axios.request(options);

    // API returns direct mp4 link here:
    return response.data.media;   // This is the real MP4 link
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

