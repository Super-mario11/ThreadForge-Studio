import { z } from 'zod';
import User from '../models/User.js';
import { createError } from '../utils/create-error.js';
import { signToken } from '../utils/jwt.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const attachSession = (res, user) => {
  const token = signToken({ userId: user._id });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return token;
};

export const register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid registration data', parsed.error.flatten());
  }

  const existingUser = await User.findOne({ email: parsed.data.email });
  if (existingUser) {
    throw createError(409, 'Email is already registered');
  }

  const user = await User.create(parsed.data);
  const token = attachSession(res, user);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
};

export const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid login data', parsed.error.flatten());
  }

  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await user.comparePassword(parsed.data.password))) {
    throw createError(401, 'Invalid email or password');
  }

  const token = attachSession(res, user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      savedDesigns: user.savedDesigns
    }
  });
};

export const me = async (req, res) => {
  res.json({ user: req.user || null });
};

export const logout = async (_req, res) => {
  res.clearCookie('token');
  res.status(204).send();
};
