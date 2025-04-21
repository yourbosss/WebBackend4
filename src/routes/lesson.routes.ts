import { Router } from 'express';
import { 
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson
} from '../controllers/lesson.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = Router();

router.get('/:courseId/lessons', getLessons);
router.get('/lessons/:id', getLesson);

router.post(
  '/:courseId/lessons',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  createLesson
);

router.put(
  '/lessons/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  updateLesson
);

router.delete(
  '/lessons/:id',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  deleteLesson
);

export default router;