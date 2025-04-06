import type { Command } from '../types';
import { refreshCommand } from './refresh';
import { startCommand } from './start';
import { stopCommand } from './stop';

export const commands: Command[] = [startCommand, stopCommand, refreshCommand];
