import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
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

const googleSchema = z.object({
  credential: z.string().min(10)
});

let googleClient = null;

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw createError(500, 'Google auth is not configured on the server');
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(clientId);
  }

  return { client: googleClient, clientId };
};

const attachSession = (res, user) => {
  const token = signToken({ userId: user._id });
  const sameSiteRaw = (process.env.COOKIE_SAMESITE || '').trim().toLowerCase();
  const sameSite =
    sameSiteRaw === 'none' || sameSiteRaw === 'lax' || sameSiteRaw === 'strict'
      ? sameSiteRaw
      : process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax';
  const secure =
    process.env.COOKIE_SECURE != null
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production' || sameSite === 'none';

  res.cookie('token', token, {
    httpOnly: true,
    sameSite,
    secure,
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

export const googleAuth = async (req, res) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, 'Invalid Google auth payload', parsed.error.flatten());
  }

  const { client, clientId } = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: parsed.data.credential,
    audience: clientId
  });
  const payload = ticket.getPayload();

  if (!payload?.email || payload.email_verified !== true) {
    throw createError(401, 'Google account email is not verified');
  }

  const email = payload.email.toLowerCase();
  const name = payload.name || email.split('@')[0];
  const avatarUrl = payload.picture || '';

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      provider: 'google',
      avatarUrl
    });
  } else if (!user.avatarUrl && avatarUrl) {
    user.avatarUrl = avatarUrl;
    if (!user.provider) user.provider = 'google';
    await user.save();
  }

  const token = attachSession(res, user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      savedDesigns: user.savedDesigns
    }
  });
};

export const logout = async (_req, res) => {
  res.clearCookie('token');
  res.status(204).send();
};
