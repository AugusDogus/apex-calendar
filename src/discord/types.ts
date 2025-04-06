import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  guildId: string;
  channelId: string;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (context: CommandContext) => Promise<void>;
}
