import { Router } from 'express';
import { registerUser, deleteUser, getUserProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.post('/register', registerUser);
router.delete('/:id', authenticateToken, deleteUser);
router.get('/profile', authenticateToken, getUserProfile);

export default router;