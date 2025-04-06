import { ChannelType, MessageFlags, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { getCalendarImage } from '../../calendar/service';
import { Database } from '../../db/client';
import { tryCatch } from '../../utils/try-catch';
import type { Command, CommandContext } from '../types';

export const startCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start monitoring the calendar in this channel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers) as SlashCommandBuilder,

  execute: async ({ interaction, guildId, channelId }: CommandContext) => {
    const db = new Database();

    // Check bot permissions
    const permissions = [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.ViewChannel,
    ];

    if (!interaction.guild?.members.me?.permissionsIn(interaction.channelId).has(permissions)) {
      await interaction.reply({
        content: 'I do not have permission to send messages in this channel',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    // Validate channel type
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'This command can only be used in a text channel',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const channel = interaction.channel;
    const existingGuild = db.get(guildId);

    if (existingGuild) {
      await interaction.reply({
        content: `Monitoring is already started in <#${existingGuild.channelId}>!`,
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const { error } = await tryCatch(async () => {
      // Defer the reply since we'll be doing some work
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      // Get the initial calendar image
      const { data: image, error: imageError } = await tryCatch(getCalendarImage());
      if (imageError) {
        throw new Error('Failed to get calendar image: ' + imageError.message);
      }

      // Send the calendar message
      const message = await channel.send({ files: [image] });

      // Add to database
      db.add({
        id: guildId,
        channelId,
        messageId: message.id,
      });

      await interaction.followUp({
        content: 'Monitoring started!',
        flags: [MessageFlags.Ephemeral],
      });
    });

    if (error) {
      console.error('Failed to start calendar monitoring:', error);
      const reply = interaction.deferred
        ? interaction.editReply.bind(interaction)
        : interaction.reply.bind(interaction);

      await reply({
        content: 'Failed to start calendar monitoring. Please try again.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
