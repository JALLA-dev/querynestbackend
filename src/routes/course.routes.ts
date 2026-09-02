import { Router, Request, Response } from 'express';
import { getAllCourses, createCourse, addLessonToModule } from '../services/course.service.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const courses = await getAllCourses();
    res.json({ courses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await createCourse(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:courseId/modules/:moduleId/lessons', async (req: Request, res: Response) => {
  try {
    const moduleId = Array.isArray(req.params.moduleId) ? req.params.moduleId[0] : req.params.moduleId;
    const result = await addLessonToModule(moduleId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
