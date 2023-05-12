import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    url: z.string(),
    token: z.string(),
    interval: z.coerce.number().int().positive().optional().default(60),
  },
  client: {},
  clientPrefix: '',
  runtimeEnv: process.env,
});
