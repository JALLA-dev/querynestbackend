import { getDb, queryOne } from '../db/connection.js';

export async function loginUser(email?: string, password?: string, role: string = 'student') {
  const db = await getDb();
  
  if (role === 'admin') {
    // Check admin credentials
    if (email && password) {
      const user = queryOne(db, 'SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin']);
      if (!user || user.password !== password) {
        throw new Error('Invalid Admin credentials. Use admin@querynest.io / admin123');
      }
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          avatarUrl: user.avatar_url,
        },
        token: 'admin-jwt-token-session',
      };
    }
    // Default admin shortcut
    return {
      user: {
        id: 'admin-1',
        name: 'Admin Sarah',
        email: 'admin@querynest.io',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      token: 'admin-jwt-token-session',
    };
  }

  // Student login
  const student = queryOne(db, "SELECT * FROM users WHERE role = 'student' LIMIT 1");
  return {
    user: {
      id: student?.id || 'user-1',
      name: student?.name || 'Alex',
      email: student?.email || 'alex.dev@querynest.io',
      role: 'student',
      avatarUrl: student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      points: student?.points || 1250,
      streakDays: student?.streak_days || 7,
    },
    token: 'student-session-token',
  };
}
