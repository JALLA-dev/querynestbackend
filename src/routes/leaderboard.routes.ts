import { Router, Request, Response } from 'express';
import { getLeaderboard } from '../services/leaderboard.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const leaderboard = await getLeaderboard();
    res.json({ leaderboard });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
