import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    CALENDAR_ID: z.string().optional().default('86b19402-2c15-4a33-9102-2b6a34ac6699'),
    DISCORD_TOKEN: z.string(),
    interval: z.coerce.number().int().positive().optional().default(60),
    DATABASE_PATH: z.string().optional().default('./'),
  },
  runtimeEnv: process.env,
});
