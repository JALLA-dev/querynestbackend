import { getDb, queryAll, queryOne } from '../db/connection.js';

export async function getPlatformStats() {
  const db = await getDb();
  
  const user = queryOne(db, "SELECT * FROM users WHERE id = 'user-1'");
  const activities = queryAll(db, "SELECT * FROM activities ORDER BY id ASC");
  const courses = queryAll(db, "SELECT * FROM courses ORDER BY created_at ASC");

  return {
    student: {
      name: user?.name || 'Alex',
      points: user?.points || 1250,
      streakDays: user?.streak_days || 7,
      completedCourses: user?.completed_courses || 2,
      tasksSolved: user?.tasks_solved || 45,
      currentLesson: {
        id: 'l4',
        title: 'INNER JOIN Explained',
        description: 'Learn how to combine rows from two or more tables based on a related column between them.',
        progressPercent: 80,
        estMinutesLeft: 5,
        courseId: 'c2',
      }
    },
    instructor: {
      totalStudents: 1240,
      completionRate: 68,
      activeToday: 156,
      courses,
      activities
    }
  };
}
