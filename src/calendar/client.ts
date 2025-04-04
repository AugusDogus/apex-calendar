import * as cheerio from 'cheerio';
import { CalendarEvent, CalendarEventSchema, CalendarSchema } from './schemas';

interface CalendarParams {
  day: number;
  month: number;
  year: number;
  calendarId: string;
}

interface EventDescription {
  success: boolean;
  data: {
    description: string;
    image: boolean | string;
  };
}

export class CalendarClient {
  private readonly baseUrl = 'https://oversightesports.com/wp-admin/admin-ajax.php';
  private readonly commonHeaders = {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    origin: 'https://oversightesports.com',
    priority: 'u=1, i',
    referer: 'https://oversightesports.com/calendar/',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
  };

  private async fetchEventDescription(eventObjectId: string): Promise<string | undefined> {
    const formData = new URLSearchParams({
      action: 'sugar_calendar_event_popover',
      event_object_id: eventObjectId,
      nonce: '327f22477f',
    });

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.commonHeaders,
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event description: ${response.statusText}`);
      }

      const data = (await response.json()) as EventDescription;
      return data.success ? data.data.description : undefined;
    } catch (err) {
      console.warn(`Failed to fetch description for event ${eventObjectId}:`, err);
      return undefined;
    }
  }

  async fetchCalendar({ day, month, year, calendarId }: CalendarParams): Promise<CalendarEvent[]> {
    const formData = new URLSearchParams({
      action: 'sugar_calendar_block_update',
      'calendar_block[id]': `sc-${calendarId}`,
      'calendar_block[attributes][clientId]': '',
      'calendar_block[attributes][display]': 'month',
      'calendar_block[attributes][accentColor]': '#ff7b00',
      'calendar_block[attributes][should_not_load_events]': 'true',
      'calendar_block[attributes][groupEventsByWeek]': 'true',
      'calendar_block[attributes][calendarId]': `${calendarId}-2c15-4a33-9102-2b6a34ac6699`,
      'calendar_block[attributes][allowUserChangeDisplay]': 'false',
      'calendar_block[attributes][showSearch]': 'false',
      'calendar_block[attributes][appearance]': 'dark',
      'calendar_block[attributes][showBlockHeader]': 'true',
      'calendar_block[attributes][showFilters]': 'true',
      'calendar_block[day]': day.toString(),
      'calendar_block[month]': month.toString(),
      'calendar_block[year]': year.toString(),
      'calendar_block[accentColor]': '#ff7b00',
      'calendar_block[display]': 'month',
      'calendar_block[visitor_tz_convert]': '1',
      'calendar_block[visitor_tz]': 'America/Chicago',
      'calendar_block[updateDisplay]': 'false',
      'calendar_block[action]': '',
      nonce: '327f22477f',
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.commonHeaders,
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }

    const rawData = await response.json();
    const result = CalendarSchema.safeParse(rawData);

    if (!result.success) {
      throw new Error(`Invalid calendar response: ${result.error.message}`);
    }

    const html = result.data.data.body;
    const $ = cheerio.load(html);
    const events: CalendarEvent[] = [];

    for (const el of $('.sugar-calendar-block__event-cell').toArray()) {
      const $el = $(el);

      const title = $el.find('.sugar-calendar-block__event-cell__title').text().trim();
      const timeElems = $el.find('time');

      const startTime = timeElems.eq(0).attr('datetime') || null;
      const endTime = timeElems.eq(1).attr('datetime') || null;
      const eventObjectId = $el.attr('data-eventobjid') || '';

      // Try to parse accent color from data-calendarsinfo JSON string
      const calendarsInfoRaw = $el.attr('data-calendarsinfo');
      let accentColor: string | undefined;

      try {
        if (calendarsInfoRaw) {
          const parsed = JSON.parse(calendarsInfoRaw.replace(/&quot;/g, '"'));
          accentColor = parsed.primary_event_color;
        }
      } catch (err) {
        console.warn(`Failed to parse calendar info for "${title}"`);
      }

      // Fetch description for the event
      const description = await this.fetchEventDescription(eventObjectId);

      const parsedEvent = CalendarEventSchema.safeParse({
        title,
        startTime,
        endTime,
        accentColor,
        eventObjectId,
        description,
      });

      if (parsedEvent.success) {
        events.push(parsedEvent.data);
      } else {
        console.warn('Invalid event skipped:', parsedEvent.error.format());
      }
    }

    return events;
  }
}
