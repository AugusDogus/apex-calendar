import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env } from '../env';
import { tryCatch } from '../utils/try-catch';
import { commands } from './commands';
import { startMonitoring } from './services/monitor';
import type { CommandContext } from './types';

export async function initializeClient(): Promise<Client> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async () => {
    console.log('Discord bot is ready!');
    await startMonitoring(client);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find((cmd) => cmd.data.name === interaction.commandName);
    if (!command) return;

    const { error } = await tryCatch(async () => {
      if (!interaction.guildId || !interaction.channelId) {
        await interaction.reply('This command can only be used in a server channel.');
        return;
      }

      const context: CommandContext = {
        interaction,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
      };

      await command.execute(context);
    });

    if (error) {
      console.error('Error executing command:', error);
      if (!interaction.replied) {
        await interaction.reply('There was an error executing this command.');
      }
    }
  });

  await client.login(env.DISCORD_TOKEN);
  return client;
}

export async function registerCommands(client: Client): Promise<void> {
  const { error } = await tryCatch(async () => {
    await client.application?.commands.set(commands.map((cmd) => cmd.data));
    console.log('Successfully registered application commands.');
  });

  if (error) {
    console.error('Error registering commands:', error);
  }
}
