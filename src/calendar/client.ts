import { load } from 'cheerio';
import pLimit from 'p-limit';
import { Database } from '../db/client';
import { tryCatch } from '../utils/try-catch';
import { CalendarEvent, CalendarEventSchema, CalendarParams, CalendarSchema, EventDescription } from './types';

const baseUrl = 'https://oversightesports.com';
const endpoints = {
  calendar: '/calendar',
  adminAjax: '/wp-admin/admin-ajax.php',
} as const;

const commonHeaders = {
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
} as const;

const limit = pLimit(5); // Limit concurrent requests to 5
const db = new Database();

const fetchNonce = async () => {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${baseUrl}${endpoints.calendar}`, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': commonHeaders['user-agent'],
      },
    }),
  );

  if (fetchError) {
    console.error('Network error fetching calendar page:', fetchError);
    throw fetchError;
  }

  if (!response?.ok) {
    const statusError = new Error(`Failed to fetch calendar page: ${response?.status} ${response?.statusText}`);
    console.error(statusError.message);
    throw statusError;
  }

  const { data: text, error: textError } = await tryCatch(response.text());
  if (textError) {
    console.error('Failed to get response text:', textError);
    throw textError;
  }

  if (!text) {
    const emptyError = new Error('Calendar page response was empty');
    console.error(emptyError.message);
    throw emptyError;
  }

  const $ = load(text);

  // Look through all <script> tags for the nonce pattern
  const scripts = $('script');

  for (const script of scripts) {
    const scriptContent = $(script).html();

    if (scriptContent?.includes('nonce')) {
      const match = scriptContent.match(/["']nonce["']\s*:\s*["']([a-f0-9]+)["']/i);
      if (match) {
        return match[1]; // the nonce value
      }
    }
  }

  const nonceError = new Error('Could not find nonce in calendar page');
  console.error(nonceError.message);
  throw nonceError;
};

const getNonce = async () => {
  const cachedNonce = db.getCachedValue('nonce');
  if (cachedNonce) {
    return cachedNonce;
  }
  const newNonce = await fetchNonce();
  db.setCachedValue('nonce', newNonce, 86400000); // Cache for 24 hours
  return newNonce;
};

const refreshNonceIfNeeded = async (error: Error) => {
  if (error.message.includes('Forbidden')) {
    const newNonce = await fetchNonce();
    db.setCachedValue('nonce', newNonce, 86400000); // Cache for 24 hours
    return true;
  }
  return false;
};

const fetchEventDescription = async (eventObjectId: string) => {
  const formData = new URLSearchParams({
    action: 'sugar_calendar_event_popover',
    event_object_id: eventObjectId,
    nonce: await getNonce(),
  });

  const { data: response, error } = await tryCatch(
    fetch(`${baseUrl}${endpoints.adminAjax}`, {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }),
  );

  if (error) throw error;
  if (!response?.ok) {
    const fetchError = new Error(`Failed to fetch event description: ${response?.statusText}`);
    if (await refreshNonceIfNeeded(fetchError)) {
      // Retry once with new nonce
      return fetchEventDescription(eventObjectId);
    }
    throw fetchError;
  }

  const { data: jsonData, error: jsonError } = await tryCatch(response.json());
  if (jsonError) throw jsonError;

  const data = jsonData as EventDescription;
  return data.success ? data.data.description : undefined;
};

export const fetchCalendar = async ({ day, month, year, calendarId }: CalendarParams) => {
  const now = new Date(Date.UTC(year, month - 1, day));
  console.log('Fetching calendar for:', now.toISOString());

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
    nonce: await getNonce(),
  });

  const { data: response, error } = await tryCatch(
    fetch(`${baseUrl}${endpoints.adminAjax}`, {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }),
  );

  if (error) throw error;
  if (!response?.ok) {
    const fetchError = new Error(`Failed to fetch calendar: ${response?.statusText}`);
    if (await refreshNonceIfNeeded(fetchError)) {
      // Retry once with new nonce
      return fetchCalendar({ day, month, year, calendarId });
    }
    throw fetchError;
  }

  const { data: rawData, error: jsonError } = await tryCatch(response.json());
  if (jsonError) throw jsonError;

  const result = CalendarSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(`Invalid calendar response: ${result.error.message}`);
  }

  const html = result.data.data.body;
  const $ = load(html);
  const eventPromises: Array<Promise<CalendarEvent | null>> = [];

  // Parse all events first
  const eventElements = $('.sugar-calendar-block__event-cell').toArray();
  console.log(`Processing ${eventElements.length} events...`);

  for (const el of eventElements) {
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

    // Queue up the description fetch with the limit
    eventPromises.push(
      limit(async () => {
        try {
          const description = await fetchEventDescription(eventObjectId);
          const parsedEvent = CalendarEventSchema.safeParse({
            title,
            startTime,
            endTime,
            accentColor,
            eventObjectId,
            description,
          });

          if (parsedEvent.success) {
            return parsedEvent.data;
          } else {
            console.warn('Invalid event skipped:', parsedEvent.error.format());
            return null;
          }
        } catch (err) {
          console.error(`Failed to fetch description for event "${title}":`, err);
          return null;
        }
      }),
    );
  }

  // Wait for all event descriptions to be fetched
  const events = (await Promise.all(eventPromises)).filter((event): event is CalendarEvent => event !== null);
  return events;
};
