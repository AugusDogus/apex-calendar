import { Database as BunDatabase } from 'bun:sqlite';
import path from 'path';
import { env } from '../env';
import { tryCatch } from '../utils/try-catch';
import type { Guild } from './types';

export class Database {
  private db: BunDatabase;

  constructor() {
    this.db = new BunDatabase(path.join(env.DATABASE_PATH, 'sqlite.db'));
    this.createTable();
  }

  private createTable(): void {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        channelId TEXT NOT NULL,
        messageId TEXT NOT NULL
      )
    `;
    this.db.run(createTableSql);

    const createCacheTableSql = `
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `;
    this.db.run(createCacheTableSql);
  }

  public add(guild: Guild): void {
    const { id, channelId, messageId } = guild;
    const { error } = tryCatch<void, Error>(() => {
      this.db.run('INSERT INTO guilds (id, channelId, messageId) VALUES (?, ?, ?)', [id, channelId, messageId]);
      console.log(`Row inserted with id ${id}, channelId ${channelId} and messageId ${messageId}`);
    });

    if (error) {
      console.error('Failed to insert guild:', error);
    }
  }

  public remove(id: string): void {
    const { error } = tryCatch<void, Error>(() => {
      this.db.run('DELETE FROM guilds WHERE id = ?', [id]);
      console.log(`Row deleted with id ${id}`);
    });

    if (error) {
      console.error('Failed to delete guild:', error);
    }
  }

  public update(guild: Guild): void {
    const { id, channelId, messageId } = guild;
    const { error } = tryCatch<void, Error>(() => {
      this.db.run('UPDATE guilds SET channelId = ?, messageId = ? WHERE id = ?', [channelId, messageId, id]);
      console.log(`Row updated with id ${id}`);
    });

    if (error) {
      console.error('Failed to update guild:', error);
    }
  }

  public get(id: string): Guild | null {
    const { data, error } = tryCatch<Guild | null, Error>(
      () => this.db.query('SELECT * FROM guilds WHERE id = ?').get(id) as Guild | null,
    );

    if (error) {
      console.error('Failed to get guild:', error);
      return null;
    }

    return data;
  }

  public getAll(): Guild[] {
    const { data, error } = tryCatch<Guild[], Error>(() => this.db.query('SELECT * FROM guilds').all() as Guild[]);

    if (error) {
      console.error('Failed to get all guilds:', error);
      return [];
    }

    return data;
  }

  public getCachedValue(key: string): string | null {
    const { data } = tryCatch<{ value: string; expires_at: number } | null, Error>(
      () =>
        this.db.query('SELECT value, expires_at FROM cache WHERE key = ?').get(key) as {
          value: string;
          expires_at: number;
        } | null,
    );

    if (!data || Date.now() > data.expires_at) {
      // Delete expired value if it exists
      if (data) {
        this.db.run('DELETE FROM cache WHERE key = ?', [key]);
      }
      return null;
    }

    return data.value;
  }

  public setCachedValue(key: string, value: string, ttlMs: number = 3600000): void {
    const expires_at = Date.now() + ttlMs;
    const { error } = tryCatch<void, Error>(() => {
      this.db.run('INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)', [key, value, expires_at]);
    });

    if (error) {
      console.error('Failed to set cached value:', error);
    }
  }

  public deleteCachedValue(key: string): void {
    const { error } = tryCatch<void, Error>(() => {
      this.db.run('DELETE FROM cache WHERE key = ?', [key]);
    });

    if (error) {
      console.error('Failed to delete cached value:', error);
    }
  }

  close(): void {
    this.db.close();
  }
}
