import { Router } from 'express';
import { 
  deleteUser, 
  getUserProfile,
  toggleFavorite,
  getCreatedCourses
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.delete('/:id', authenticateToken, deleteUser);
router.get('/profile', authenticateToken, getUserProfile);
router.post('/favorites/:courseId', authenticateToken, toggleFavorite);
router.get('/my-courses', authenticateToken, getCreatedCourses);

export default router;