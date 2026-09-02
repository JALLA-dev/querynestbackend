import { Router, Request, Response } from 'express';
import { loginUser } from '../services/auth.service.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const result = await loginUser(email, password, role || 'student');
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

export default router;
