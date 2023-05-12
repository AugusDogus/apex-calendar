import sqlite3 from 'sqlite3';

type Guild = {
  id: string;
  channelId: string;
  messageId: string;
};

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('./db.sqlite3');
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
  }

  public async add(guild: Guild): Promise<void> {
    const { id, channelId, messageId } = guild;
    try {
      const result = await this.db.run('INSERT INTO guilds (id, channelId, messageId) VALUES (?, ?, ?)', [
        id,
        channelId,
        messageId,
      ]);
      console.log(`Row inserted with id ${id}, channelId ${channelId} and messageId ${messageId}`);
    } catch (err) {
      console.error(err.message);
    }
  }

  public remove(id: string): void {
    const deleteSql = `
      DELETE FROM guilds
      WHERE id = ?
    `;
    this.db.run(deleteSql, [id], (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`Row deleted with id ${id}`);
      }
    });
  }

  public update(guild: Guild): void {
    const { id, channelId, messageId } = guild;
    const updateSql = `
      UPDATE guilds
      SET channelId = ?, messageId = ?
      WHERE id = ?
    `;
    this.db.run(updateSql, [channelId, messageId, id], (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`Row updated with id ${id}`);
      }
    });
  }

  public get(id: string): Promise<Guild | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM guilds WHERE id = ?', [id], (err, row: Guild | undefined) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(null);
        } else {
          resolve(row);
        }
      });
    });
  }

  public getAll(): Promise<Guild[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM guilds', [], (err, rows: Guild[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
