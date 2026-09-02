import { Router, Request, Response } from 'express';
import { executeSqlQuery, getSandboxSchema } from '../services/sql.service.js';

const router = Router();

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { query, lessonId } = req.body;
    const result = await executeSqlQuery(query, lessonId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Execution error' });
  }
});

router.get('/schema', async (_req: Request, res: Response) => {
  try {
    const tables = await getSandboxSchema();
    res.json({ tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
