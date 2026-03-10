import { Router } from 'express';
import { generateDesign } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/generate', requireAuth, generateDesign);

export default router;
