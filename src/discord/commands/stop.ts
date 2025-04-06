import { ChannelType, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { Database } from '../../db/client';
import { tryCatch } from '../../utils/try-catch';
import { getChannel } from '../helpers';
import type { Command, CommandContext } from '../types';

export const stopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop monitoring the calendar in this server')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addBooleanOption((option) =>
      option.setName('delete').setDescription('Delete the calendar message').setRequired(false),
    ) as SlashCommandBuilder,

  execute: async ({ interaction, guildId }: CommandContext) => {
    const db = new Database();
    const guild = db.get(guildId);

    if (!guild) {
      await interaction.reply({
        content: 'Monitoring is not started!',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const { error } = await tryCatch(async () => {
      const shouldDelete = interaction.options.getBoolean('delete') ?? false;

      // Get the channel and try to delete the message
      const channel = await getChannel({ client: interaction.client, channelId: guild.channelId });
      if (channel?.type === ChannelType.GuildText && shouldDelete) {
        const { data: message } = await tryCatch(channel.messages.fetch(guild.messageId));
        if (message) {
          await message.delete();
        }
      }

      // Remove from database
      db.remove(guildId);

      await interaction.reply({
        content: 'Monitoring stopped!',
        flags: [MessageFlags.Ephemeral],
      });
    });

    if (error) {
      console.error('Failed to stop calendar monitoring:', error);
      await interaction.reply({
        content: 'Failed to stop calendar monitoring. Please try again.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
