import { Router } from 'express';
import { 
  getComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller';
import { checkAuthentication } from '../middleware/checkAuthentication';

const router = Router();

router.get('/:lessonId/comments', getComments);
router.post('/:lessonId/comments', checkAuthentication, createComment);
router.put('/comments/:id', checkAuthentication, updateComment);
router.delete('/comments/:id', checkAuthentication, deleteComment);

export default router;
