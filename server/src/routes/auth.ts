import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  const token = signToken(user._id);
  res.status(201).json({ token, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  
  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user._id);
  res.json({ token, email: user.email });
});

// Stateless JWT: the client discards its token. This endpoint exists so the
// frontend has a single, explicit logout call and so we can add server-side
// token revocation later without changing the client contract.
router.post('/logout', requireAuth, async (_req: AuthedRequest, res) => {
  res.json({ status: 'ok' });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  res.json({ email: user.email });
});

export default router;