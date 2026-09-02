import { Router, Request, Response } from 'express';
import { getPlatformStats } from '../services/stats.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const stats = await getPlatformStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
