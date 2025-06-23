import { Router } from 'express';
import { checkAuthentication as authMiddleware } from '../middleware/checkAuthentication';
import {
  enrollOnCourse,
  getCourseProgress,
  completeLesson,
  undoCompleteLesson,
  countStudentsOnCourse,
  completeCourse
} from '../controllers/enrollment.controller';
const router = Router();

router.post('/:courseId/enroll', authMiddleware, enrollOnCourse);
router.get('/:courseId/progress', authMiddleware, getCourseProgress);
router.post('/:courseId/lessons/:lessonId/complete', authMiddleware, completeLesson);
router.post('/:courseId/lessons/:lessonId/undo', authMiddleware, undoCompleteLesson);
router.get('/:courseId/students/count', countStudentsOnCourse);
router.post('/:courseId/complete', authMiddleware, completeCourse);

export default router;