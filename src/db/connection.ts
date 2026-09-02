import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { initSchema, seedDatabase } from './schema.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'querynest.sqlite');

let dbInstance: any = null;
let initPromise: Promise<any> | null = null;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    let SQL;
    if (fs.existsSync(wasmPath)) {
      const wasmBinary = new Uint8Array(fs.readFileSync(wasmPath));
      SQL = await initSqlJs({ wasmBinary: wasmBinary as any });
    } else {
      SQL = await initSqlJs();
    }

    let db: any;
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileBuffer = new Uint8Array(fs.readFileSync(DB_PATH));
        db = new SQL.Database(fileBuffer as any);
      } catch {
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }

    initSchema(db);
    seedDatabase(db);
    saveDb(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export function saveDb(db: any = dbInstance!) {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database file:', err);
  }
}

export function queryAll<T = any>(db: any, sql: string, params: any[] = []): T[] {
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error(`SQL query error on "${sql}":`, err);
    return [];
  }
}

export function queryOne<T = any>(db: any, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function runExec(db: any, sql: string, params: any[] = []) {
  if (params && params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    db.exec(sql);
  }
  saveDb(db);
}
