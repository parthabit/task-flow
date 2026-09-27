import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User.model';

export interface AuthPayload {
  sub: string;
  role: 'user' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verifies the short-lived JWT access token sent in the Authorization header.
 * Does NOT hit the database for every request, keeping this middleware fast;
 * role checks below trust the role embedded in the token.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwt.accessSecret) as AuthPayload;

    // Confirm the user still exists (handles deleted/deactivated accounts).
    const exists = await User.exists({ _id: payload.sub });
    if (!exists) throw ApiError.unauthorized('User no longer exists');

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(err);
  }
}
