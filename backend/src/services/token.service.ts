import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { RefreshToken } from '../models/RefreshToken.model';
import { IUser } from '../models/User.model';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function msFromExpiry(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

export function signAccessToken(user: IUser): string {
  const options: jwt.SignOptions = { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, options);
}

/**
 * Issues a new opaque refresh token, persists it (so it can be revoked / rotated),
 * and returns the raw token to hand to the client as an httpOnly cookie.
 */
export async function issueRefreshToken(user: IUser): Promise<string> {
  const raw = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + msFromExpiry(env.jwt.refreshExpiresIn));
  await RefreshToken.create({ user: user._id, token: raw, expiresAt });
  return raw;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ userId: string; newToken: string } | null> {
  const existing = await RefreshToken.findOne({ token: oldToken, revoked: false });
  if (!existing || existing.expiresAt < new Date()) return null;

  existing.revoked = true;
  await existing.save();

  const raw = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + msFromExpiry(env.jwt.refreshExpiresIn));
  await RefreshToken.create({ user: existing.user, token: raw, expiresAt });

  return { userId: existing.user.toString(), newToken: raw };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.updateOne({ token }, { revoked: true });
}
