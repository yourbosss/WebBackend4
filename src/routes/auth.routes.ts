import { Router } from 'express';
import { loginUser } from '../controllers/auth.controller';
import { registerUser } from '../controllers/user.controller';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;
