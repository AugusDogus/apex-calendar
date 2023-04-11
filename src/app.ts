import { ChannelType, Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import puppeteer from 'puppeteer';

try {
  fs.rmSync('calendar.png');
} catch (e) {
  if (e.code !== 'ENOENT') console.log(e);
}

const getCalendarImage = async () => {
  const browser = await getBrowser();
  if (typeof process.env.url !== 'string') throw new Error('No URL provided');
  const page = await browser.newPage();
  await page.goto(process.env.url);
  await page.mouse.click(1000, 1000);
  const image = await page.screenshot({ clip: { x: 46, y: 167, width: 1057, height: 780 } });
  await browser.close();
  return image;
};

const getBrowser = async () => {
  return puppeteer.launch({
    args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
};

// Import discord client
const client = new Client({ intents: [GatewayIntentBits.GuildMessages] });

client.on('ready', async () => {
  if (process.env.channel === undefined) throw new Error('No channel provided');

  console.log(`Logged in as ${client.user?.tag}!`);
  const image = await getCalendarImage();

  // Get the channel
  const channel = client.channels.cache.get(process.env.channel) || (await client.channels.fetch(process.env.channel));
  if (channel === undefined || channel === null) throw new Error('Channel not found');
  if (channel.type !== ChannelType.GuildText) throw new Error('Channel is not a text channel');

  // Check if there is already a message in the channel from the bot
  const messages = await channel.messages.fetch({ limit: 10 });
  if (messages.size === 0) {
    // No messages in channel, send image
    channel.send({ files: [image] });
  }

  for (const message of messages.values()) {
    if (message.author.id !== client.user?.id) {
      // Message is not from bot, send image
      channel.send({ files: [image] });
    } else {
      // Message is from bot, edit image
      message.edit({ files: [image] });
    }
  }
});

client.login(process.env.token);
