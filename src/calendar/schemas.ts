import { z } from 'zod';

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
