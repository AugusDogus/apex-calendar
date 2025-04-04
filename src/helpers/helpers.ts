import { ChannelType, Client, TextChannel } from 'discord.js';
import { CalendarService } from '../calendar/service';
import type { Database } from '../db/db';
import { getChannel } from '../discord/getChannel';
import { env } from '../env';

export type Props = { client: Client; db: Database };

const calendarService = new CalendarService();

export const checkCalendar = async ({ client, db }: Props) => {
  // Get the calendar image
  const image = await calendarService.getCalendarImage();

  // Get the guilds from the database
  const guilds = await db.getAll();

  // Loop through the guilds
  for (const guild of guilds) {
    // Get the channel
    const channel = await getChannel({ channelId: guild.channelId, client });
    if (channel === undefined || channel === null || channel.type !== ChannelType.GuildText) return;

    // Get the message
    const message = await tryFetchMessage({ channel, messageId: guild.messageId });

    if (message) {
      // Update the message with an image of the latest calendar
      message.edit({ files: [image] });
    } else {
      const newMessage = await channel.send({ files: [image] });
      db.update({ id: guild.id, messageId: newMessage.id, channelId: guild.channelId });
    }
  }
};

export const startMonitoring = async ({ client, db }: Props) => {
  setInterval(async () => {
    await checkCalendar({ client, db });
  }, 1000 * 60 * env.interval);

  return checkCalendar({ client, db });
};

const tryFetchMessage = async ({ channel, messageId }: { channel: TextChannel; messageId: string }) => {
  try {
    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    return null;
  }
};
