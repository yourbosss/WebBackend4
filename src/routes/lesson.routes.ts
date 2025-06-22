import { Router } from 'express';
import { 
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson
} from '../controllers/lesson.controller';
import { checkAuthentication } from '../middleware/checkAuthentication';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = Router();

router.get('/:courseId/lessons', getLessons);
router.get('/lessons/:id', getLesson);

router.post('/:courseId/lessons', checkAuthentication, authorizeRoles('teacher', 'admin'), createLesson);
router.put('/lessons/:id', checkAuthentication, authorizeRoles('teacher', 'admin'), updateLesson);
router.delete('/lessons/:id', checkAuthentication, authorizeRoles('teacher', 'admin'), deleteLesson);

export default router;
