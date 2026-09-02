import { getDb, queryAll } from '../db/connection.js';

export async function getLeaderboard() {
  const db = await getDb();
  return queryAll(db, 'SELECT * FROM leaderboard ORDER BY rank ASC');
}
