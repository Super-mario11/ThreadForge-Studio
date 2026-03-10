import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { createError } from '../utils/create-error.js';

export const requireAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    throw createError(401, 'Authentication required');
  }

  const payload = verifyToken(token);
  const user = await User.findById(payload.userId).select('-password');

  if (!user) {
    throw createError(401, 'Session is no longer valid');
  }

  req.user = user;
  next();
};
