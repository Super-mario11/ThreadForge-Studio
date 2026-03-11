import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { createError } from '../utils/create-error.js';

const getToken = (req) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  return req.cookies.token || bearerToken;
};

const getUserFromToken = async (token) => {
  const payload = verifyToken(token);
  return User.findById(payload.userId).select('-password');
};

export const requireAuth = async (req, _res, next) => {
  const token = getToken(req);

  if (!token) {
    throw createError(401, 'Authentication required');
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw createError(401, 'Session is no longer valid');
  }

  req.user = user;
  next();
};

export const optionalAuth = async (req, _res, next) => {
  const token = getToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const user = await getUserFromToken(token);
    req.user = user || null;
  } catch {
    req.user = null;
  }

  return next();
};
