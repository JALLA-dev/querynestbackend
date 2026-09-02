import { Router, Request, Response } from 'express';
import { getAllQuizzes, submitQuizAnswers } from '../services/quiz.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const quizzes = await getAllQuizzes(category);
    res.json({ quizzes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }
    const result = await submitQuizAnswers(answers);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
