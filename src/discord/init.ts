import { ApplicationCommandOptionType, ChannelType, Client, PermissionsBitField } from 'discord.js';
import { Props } from '../helpers/helpers';
import { getCalendarImage } from '../puppeteer/getImage';
import { getChannel } from './getChannel';

export const init = async ({ client, db }: Props) => {
  await addCommands(client);
  await handleCommands({ client, db });
};

const addCommands = async (client: Client) => {
  await client.application?.commands.create({
    name: 'start',
    description: 'Start calendar monitoring',
    defaultMemberPermissions: [PermissionsBitField.Flags.KickMembers],
  });
  await client.application?.commands.create({
    name: 'stop',
    description: 'Stop calendar monitoring',
    defaultMemberPermissions: [PermissionsBitField.Flags.KickMembers],
    options: [
      {
        name: 'delete',
        description: 'Remove the calendar message? (default: false)',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  });
  await client.application?.commands.create({
    name: 'refresh',
    description: 'Refresh the calendar',
    defaultMemberPermissions: [PermissionsBitField.Flags.KickMembers],
  });
};

const handleCommands = async ({ client, db }: Props) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const permissions = [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.ViewChannel,
    ];

    if (!interaction?.guild?.members.me?.permissionsIn(interaction.channelId).has(permissions)) {
      await interaction.reply({
        content: 'I do not have permission to send messages in this channel',
        ephemeral: true,
      });
      return;
    }

    // Get the channel the interaction was sent in
    const channel = await getChannel({ interaction, client });

    if (channel === undefined || channel === null || channel.type !== ChannelType.GuildText) return;

    // Check if the command is start or stop
    if (interaction.commandName === 'start') {
      await interaction.deferReply({ ephemeral: true });

      // Make sure there is a guild id
      if (interaction.guildId === undefined || interaction.guildId === null) return;

      // Check if the guild is already in the database
      const guild = await db.get(interaction.guildId);

      if (guild !== null) {
        // Guild is already in database, reply to the interaction
        await interaction.editReply({
          content: `Monitoring is already started in <#${guild.channelId}>!`,
        });
      } else {
        // Get the latest calendar image
        const image = await getCalendarImage();

        // Send the image to the channel
        const message = await channel.send({ files: [image] });

        // Store the guild id in the database
        await db.add({ id: interaction.guildId, channelId: channel.id, messageId: message.id });

        // Reply to the interaction
        await interaction.followUp({ content: 'Monitoring started!' });
      }
    } else if (interaction.commandName === 'stop') {
      // Make sure there is a guild id
      if (interaction.guildId === undefined || interaction.guildId === null) return;

      // Check if the guild is already in the database
      const guild = await db.get(interaction.guildId);

      if (guild === null) {
        // Guild is not in database, reply to the interaction
        await interaction.reply({ content: 'Monitoring is not started!', ephemeral: true });
        return;
      }

      // Check if the user wants to delete the message
      const deleteMessage = interaction.options.getBoolean('delete') ?? false;

      if (deleteMessage) {
        // Delete the message
        await channel.messages.delete(guild.messageId);
      }

      // Remove the guild id from the database
      db.remove(interaction.guildId);

      // Reply to the interaction
      await interaction.reply({ content: 'Monitoring stopped!', ephemeral: true });
    } else if (interaction.commandName === 'refresh') {
      await interaction.deferReply({ ephemeral: true });

      // Make sure there is a guild id
      if (interaction.guildId === undefined || interaction.guildId === null) return;

      // Check if the guild is already in the database
      const guild = await db.get(interaction.guildId);

      if (guild === null) {
        // Guild is not in database, reply to the interaction
        await interaction.editReply({ content: 'Monitoring is not started!' });
        return;
      }

      // Get the latest calendar image
      const image = await getCalendarImage();

      // Get the message
      const message = await channel.messages.fetch(guild.messageId);

      // Edit the message
      await message.edit({ files: [image] });

      // Reply to the interaction
      await interaction.followUp({ content: 'Calendar refreshed!', ephemeral: true });
    }
  });
};
