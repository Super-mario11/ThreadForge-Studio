import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', optionalAuth, me);
router.post('/logout', logout);

export default router;
