import { Router } from 'express';
import {
  confirmOfflineOrder,
  createCheckoutSession,
  getCheckoutQuote,
  handleStripeWebhook,
  listMyOrders
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/webhook', handleStripeWebhook);
router.post('/quote', getCheckoutQuote);
router.post('/checkout', createCheckoutSession);
router.post('/:orderId/confirm-offline', confirmOfflineOrder);
router.get('/mine', requireAuth, listMyOrders);

export default router;
