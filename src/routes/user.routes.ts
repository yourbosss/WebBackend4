import { Router } from 'express';
import { 
  deleteUser, 
  getUserProfile,
  toggleFavorite,
  getCreatedCourses
} from '../controllers/user.controller';
import { checkAuthentication } from '../middleware/checkAuthentication';

const router = Router();

router.delete('/:id', checkAuthentication, deleteUser);
router.get('/profile', checkAuthentication, getUserProfile);
router.post('/favorites/:courseId', checkAuthentication, toggleFavorite);
router.get('/my-courses', checkAuthentication, getCreatedCourses);

export default router;
