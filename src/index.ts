import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlRoutes from './routes/sql.routes.js';
import courseRoutes from './routes/course.routes.js';
import statsRoutes from './routes/stats.routes.js';
import videoRoutes from './routes/video.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import authRoutes from './routes/auth.routes.js';
import { getDb } from './db/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Dynamic CORS handling to support Vercel preview and production domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      CORS_ORIGIN === '*' || 
      CORS_ORIGIN.split(',').map(s => s.trim()).includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'QueryNest Backend Server', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sql', sqlRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Initialize DB and start server
async function start() {
  try {
    await getDb();
    console.log('✅ SQLite Database initialized and seeded successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 QueryNest Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
