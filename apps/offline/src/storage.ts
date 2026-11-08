import * as SQLite from 'expo-sqlite';
import { CoreState, stateSchema } from './domain';
const db = SQLite.openDatabaseAsync('core-personal-offline-v1.db').then(async (db) => {
  await db.execAsync(
    'PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id = 1), value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS recovery (id INTEGER PRIMARY KEY CHECK(id = 1), value TEXT NOT NULL);',
  );
  return db;
});
export async function loadState(): Promise<CoreState | null> {
  const row = await (
    await db
  ).getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE id = 1');
  return row ? stateSchema.parse(JSON.parse(row.value)) : null;
}
export async function persistState(state: CoreState) {
  await (
    await db
  ).runAsync(
    'INSERT INTO app_state (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
    JSON.stringify(stateSchema.parse(state)),
  );
}
export async function loadRecovery(): Promise<CoreState | null> {
  const row = await (
    await db
  ).getFirstAsync<{ value: string }>('SELECT value FROM recovery WHERE id = 1');
  return row ? stateSchema.parse(JSON.parse(row.value)) : null;
}
export async function restoreState(state: CoreState) {
  const value = JSON.stringify(stateSchema.parse(state));
  await (
    await db
  ).withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      'INSERT INTO recovery (id, value) SELECT id, value FROM app_state WHERE id = 1 ON CONFLICT(id) DO UPDATE SET value = excluded.value',
    );
    await tx.runAsync(
      'INSERT INTO app_state (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
      value,
    );
  });
}
