/**
 * Database
 * SQLite connection and initialization
 */

const sqlite3 = require('sqlite3').verbose();
const EventEmitter = require('events');
const schema = require('./schema');

class Database extends EventEmitter {
  constructor(options = {}) {
    super();
    this.dbPath = options.dbPath || ':memory:';
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          this.emit('error', err);
          reject(err);
        } else {
          this.isConnected = true;
          this.emit('connected');
          this.initialize().then(resolve).catch(reject);
        }
      });
    });
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db.exec(schema, async (err) => {
        if (err) {
          this.emit('initialization-error', err);
          reject(err);
          return;
        }

        try {
          await this.ensureAlertColumns();
          this.emit('initialized');
          resolve();
        } catch (migrationError) {
          this.emit('initialization-error', migrationError);
          reject(migrationError);
        }
      });
    });
  }

  async ensureAlertColumns() {
    const columns = await this.all('PRAGMA table_info(alerts)');
    const names = new Set(columns.map((column) => column.name));
    const migrations = [
      ['rule_id', 'TEXT'],
      ['market', 'TEXT'],
      ['alert_data', 'TEXT'],
    ];

    for (const [name, type] of migrations) {
      if (!names.has(name)) {
        await this.run(`ALTER TABLE alerts ADD COLUMN ${name} ${type}`);
      }
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async transaction(callback) {
    try {
      await this.run('BEGIN TRANSACTION');
      await callback();
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            this.isConnected = false;
            this.emit('closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async clear() {
    const tables = [
      'ticks',
      'analytics_snapshots',
      'signals',
      'insights',
      'alerts',
      'sessions',
      'watchlists',
      'reports',
    ];

    for (const table of tables) {
      await this.run(`DELETE FROM ${table}`);
    }
  }

  async vacuum() {
    return this.run('VACUUM');
  }

  async getSize() {
    const result = await this.get(
      'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()'
    );
    return result?.size || 0;
  }
}

module.exports = Database;
