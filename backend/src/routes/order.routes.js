import { Router } from 'express';
import {
  createCheckoutSession,
  getCheckoutQuote,
  getOrderById,
  handleStripeWebhook,
  listMyOrders
} from '../controllers/order.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/webhook', handleStripeWebhook);
router.post('/quote', getCheckoutQuote);
router.post('/checkout', createCheckoutSession);
router.get('/mine', requireAuth, listMyOrders);
router.get('/:orderId', optionalAuth, getOrderById);

export default router;
