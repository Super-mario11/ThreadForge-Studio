import { Router } from 'express';
import { getFeaturedProducts, listProducts } from '../controllers/product.controller.js';

const router = Router();

router.get('/', listProducts);
router.get('/featured', getFeaturedProducts);

export default router;
