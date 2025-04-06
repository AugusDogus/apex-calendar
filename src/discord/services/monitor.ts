import { CronJob } from 'cron';
import { ChannelType, Client } from 'discord.js';
import { getCalendarImage } from '../../calendar/service';
import { Database } from '../../db/client';
import { env } from '../../env';
import { tryCatch } from '../../utils/try-catch';
import { getChannel } from '../helpers';

export const checkCalendar = async (client: Client) => {
  const db = new Database();

  // Get the calendar image
  const { data: image, error: imageError } = await tryCatch(getCalendarImage());
  if (imageError) {
    console.error('Failed to get calendar image:', imageError);
    return;
  }

  // Get the guilds from the database
  const guilds = db.getAll();

  if (guilds.length === 0) {
    console.log('No guilds found in database, skipping calendar update');
    return;
  }

  // Loop through the guilds
  let updatedCount = 0;
  for (const guild of guilds) {
    // Get the channel
    const channel = await getChannel({ channelId: guild.channelId, client });
    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error(`Could not find text channel ${guild.channelId} in guild ${guild.id}`);
      continue;
    }

    // Get the message
    const { data: message, error: fetchError } = await tryCatch(channel.messages.fetch(guild.messageId));
    if (fetchError) {
      console.error(`Failed to fetch message ${guild.messageId} in guild ${guild.id}:`, fetchError);
      continue;
    }

    if (message) {
      // Update the message with an image of the latest calendar
      const { error: editError } = await tryCatch(message.edit({ files: [image] }));
      if (editError) {
        console.error(`Failed to update message ${message.id} in guild ${guild.id}:`, editError);
        continue;
      }
      updatedCount++;
    } else {
      const { data: newMessage, error: sendError } = await tryCatch(channel.send({ files: [image] }));
      if (sendError) {
        console.error(`Failed to send new message in guild ${guild.id}:`, sendError);
        continue;
      }

      db.update({ id: guild.id, messageId: newMessage.id, channelId: guild.channelId });
      updatedCount++;
    }
  }

  console.log(`Updated calendar in ${updatedCount}/${guilds.length} guilds`);
};

export const startMonitoring = async (client: Client) => {
  // Do initial check immediately
  const { error: initialError } = await tryCatch(checkCalendar(client));
  if (initialError) {
    console.error('Failed initial calendar check:', initialError);
    return;
  }

  // Calculate the cron pattern based on the interval
  const minutes = Array.from({ length: Math.floor(60 / env.interval) }, (_, i) => i * env.interval).join(',');
  const cronPattern = `${minutes} * * * *`;

  // Create a cron job that runs at the specified interval
  const job = new CronJob(
    cronPattern,
    async () => {
      const { error } = await tryCatch(checkCalendar(client));
      if (error) console.error('Error checking calendar:', error);
    },
    null, // onComplete
    true, // start
    'UTC', // timezone
  );

  console.log(`Calendar monitoring started (${env.interval}m interval, next update: ${job.nextDate().toString()})`);
  return job;
};
