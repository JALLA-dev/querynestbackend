import { getDb, queryAll, runExec } from '../db/connection.js';

export async function getVideos(searchQuery: string = '') {
  const db = await getDb();
  let videos = queryAll(db, 'SELECT * FROM videos ORDER BY created_at DESC');

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    videos = videos.filter((v: any) =>
      v.title.toLowerCase().includes(q) ||
      (v.lesson_name && v.lesson_name.toLowerCase().includes(q))
    );
  }

  return {
    videos,
    storage: {
      usedGb: 45,
      totalGb: 100,
      totalVideos: videos.length || 124,
      unassignedCount: 3,
    }
  };
}

export async function addVideo(data: {
  title: string;
  lesson_name?: string;
  module_name?: string;
  duration?: string;
  size_mb?: number;
}) {
  if (!data.title) {
    throw new Error('Title is required');
  }

  const db = await getDb();
  const id = 'v' + Date.now();
  const thumbnail = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80';

  runExec(db, `
    INSERT INTO videos (id, title, lesson_name, module_name, duration, size_mb, thumbnail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id, 
    data.title, 
    data.lesson_name || 'General SQL', 
    data.module_name || 'Module 1', 
    data.duration || '10:00', 
    data.size_mb || 150, 
    thumbnail
  ]);

  return { success: true, id };
}
