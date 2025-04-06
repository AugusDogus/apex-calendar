import { initializeClient, registerCommands } from './discord/client';
import { tryCatch } from './utils/try-catch';

const { error } = await tryCatch(async () => {
  const client = await initializeClient();
  await registerCommands(client);
});

if (error) {
  console.error('Failed to start the application:', error);
  process.exit(1);
}
