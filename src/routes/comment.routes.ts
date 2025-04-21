import { Router } from 'express';
import { 
  getComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.get('/:lessonId/comments', getComments);
router.post(
  '/:lessonId/comments',
  authenticateToken,
  createComment
);
router.put(
  '/comments/:id',
  authenticateToken,
  updateComment
);
router.delete(
  '/comments/:id',
  authenticateToken,
  deleteComment
);

export default router;