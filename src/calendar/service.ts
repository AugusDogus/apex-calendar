import { AttachmentBuilder } from 'discord.js';
import { env } from '../env';
import { fetchCalendar } from './client';
import { renderCalendarEvents } from './render';

export const getCalendarImage = async () => {
  // Get current date
  const now = new Date();
  const events = await fetchCalendar({
    day: now.getDate(),
    month: now.getMonth() + 1, // JavaScript months are 0-based
    year: now.getFullYear(),
    calendarId: env.CALENDAR_ID,
  });

  const buffer = await renderCalendarEvents(events);
  console.log(`Calendar rendered (${(buffer.length / 1024).toFixed(1)} KB)`);

  return new AttachmentBuilder(buffer, { name: 'calendar.png' });
};
