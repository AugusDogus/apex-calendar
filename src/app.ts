import { Client, GatewayIntentBits } from 'discord.js';
import { Database } from './db/db';
import { init } from './discord/init';
import { startMonitoring } from './helpers/helpers';
import { env } from './env';

// Import discord client
const client = new Client({
  intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
});
const db = new Database();

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  await init({ client, db });
  await startMonitoring({ client, db });
});

// Login to discord
client.login(env.DISCORD_TOKEN);
