import { Router } from 'express';
import { 
  registerUser, 
  deleteUser, 
  getUserProfile,
  toggleFavorite
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.post('/register', registerUser);
router.delete('/:id', authenticateToken, deleteUser); // Удаление пользователя
router.get('/profile', authenticateToken, getUserProfile); // Получение профиля пользователя
router.post('/favorites/:courseId', authenticateToken, toggleFavorite); // Добавление/удаление из избранного

export default router;
