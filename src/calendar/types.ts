import { z } from 'zod';

// Parameters interface for calendar fetching
export interface CalendarParams {
  day: number;
  month: number;
  year: number;
  calendarId: string;
}

// Interface for event description responses
export interface EventDescription {
  success: boolean;
  data: {
    description: string;
    image: boolean | string;
  };
}

// Interface for calendar object from the page
export interface CalendarObj {
  nonce: string;
  ajax_url: string;
  strings: {
    events_on: string;
    this_month: string;
    this_week: string;
    today: string;
  };
  settings: {
    sow: number;
  };
}

// Schema for the calendar JSON structure
export const CalendarSchema = z.object({
  success: z.boolean(),
  data: z.object({
    body: z.string(),
    heading: z.string(),
    heading_mobile: z.string(),
    is_update_display: z.boolean(),
    control_labels: z.object({
      prev: z.string(),
      next: z.string(),
    }),
    date: z.object({
      day: z.string(),
      month: z.number(),
      year: z.string(),
    }),
  }),
});

// Schema for each individual event
export const CalendarEventSchema = z.object({
  title: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  accentColor: z.string().optional(),
  eventObjectId: z.string(),
  description: z.string().optional(),
});

export type CalendarResponse = z.infer<typeof CalendarSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>; 