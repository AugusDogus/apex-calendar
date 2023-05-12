import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CALENDAR_URL: z
      .string()
      .optional()
      .default('https://docs.google.com/spreadsheets/d/1Ca_ixagdxMgSn9zeT8ZBwJmgtTt9i3wR59BfV1htkPY'),
    DISCORD_TOKEN: z.string(),
    interval: z.coerce.number().int().positive().optional().default(60),
    DATABASE_PATH: z.string().optional().default('./'),
  },
  client: {},
  clientPrefix: '',
  runtimeEnv: process.env,
});
