import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export interface AuthedRequest extends Request {
  userId?: mongoose.Types.ObjectId;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return secret;
}

export function signToken(userId: mongoose.Types.ObjectId): string {
  return jwt.sign({ sub: userId.toString() }, getSecret(), { expiresIn: '7d' });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, getSecret()) as { sub: string };
    req.userId = new mongoose.Types.ObjectId(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}