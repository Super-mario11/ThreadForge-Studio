import { Router } from 'express';
import {
  createCheckoutSession,
  getCheckoutQuote,
  getOrderById,
  handleRazorpayWebhook,
  verifyRazorpayPayment,
  listMyOrders
} from '../controllers/order.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/webhook', handleRazorpayWebhook);
router.post('/quote', getCheckoutQuote);
router.post('/checkout', createCheckoutSession);
router.post('/verify-payment', verifyRazorpayPayment);
router.get('/mine', requireAuth, listMyOrders);
router.get('/:orderId', optionalAuth, getOrderById);

export default router;
