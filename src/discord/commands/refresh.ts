import { ChannelType, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { getCalendarImage } from '../../calendar/service';
import { Database } from '../../db/client';
import { tryCatch } from '../../utils/try-catch';
import { getChannel } from '../helpers';
import type { Command, CommandContext } from '../types';

export const refreshCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Refresh the calendar message')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers) as SlashCommandBuilder,

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
      // First defer the reply since we'll be doing some work
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      // Get the channel and message
      const channel = await getChannel({ client: interaction.client, channelId: guild.channelId });
      if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Could not find text channel');
      }

      const { data: message, error: fetchError } = await tryCatch(channel.messages.fetch(guild.messageId));
      if (fetchError || !message) {
        throw new Error('Failed to fetch message');
      }

      // Get the new calendar image
      const { data: image, error: imageError } = await tryCatch(getCalendarImage());
      if (imageError) {
        throw new Error('Failed to get calendar image: ' + imageError.message);
      }

      // Update the message
      await message.edit({ files: [image] });

      await interaction.followUp({
        content: 'Calendar refreshed!',
        flags: [MessageFlags.Ephemeral],
      });
    });

    if (error) {
      console.error('Failed to refresh calendar:', error);
      const reply = interaction.deferred
        ? interaction.editReply.bind(interaction)
        : interaction.reply.bind(interaction);

      await reply({
        content: 'Failed to refresh calendar. Please try again.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
