import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CALENDAR_URL: z.string(),
    DISCORD_TOKEN: z.string(),
    interval: z.coerce.number().int().positive().optional().default(60),
    DATABASE_PATH: z.string().optional().default('./'),
  },
  client: {},
  clientPrefix: '',
  runtimeEnv: process.env,
});
