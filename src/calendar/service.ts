import { env } from '../env';
import { CalendarClient } from './client';
import { renderCalendarEvents } from './render';

export class CalendarService {
  private readonly client: CalendarClient;

  constructor() {
    this.client = new CalendarClient();
  }

  async getCalendarImage(): Promise<Buffer> {
    // Get current date
    const now = new Date();
    const events = await this.client.fetchCalendar({
      day: now.getDate(),
      month: now.getMonth() + 1, // JavaScript months are 0-based
      year: now.getFullYear(),
      calendarId: env.CALENDAR_ID,
    });

    return renderCalendarEvents(events);
  }
}
