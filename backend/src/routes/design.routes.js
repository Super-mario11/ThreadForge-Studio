import { Router } from 'express';
import { getSavedDesigns, saveDesign } from '../controllers/design.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getSavedDesigns);
router.post('/', requireAuth, saveDesign);

export default router;
