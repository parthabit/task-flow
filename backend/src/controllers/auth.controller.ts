import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { registerUser, loginUser } from '../services/auth.service';
import { rotateRefreshToken, revokeRefreshToken, signAccessToken } from '../services/token.service';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? ('none' as const) : ('lax' as const),
  path: '/api/auth',
};

/** POST /api/auth/signup */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await registerUser(name, email, password);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json(ApiResponse.success({ user, accessToken }, 'Account created'));
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser(email, password);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json(ApiResponse.success({ user, accessToken }, 'Logged in'));
});

/** POST /api/auth/refresh - rotates the refresh token and issues a new access token */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const rotated = await rotateRefreshToken(token);
  if (!rotated) throw ApiError.unauthorized('Refresh token invalid or expired');

  const user = await User.findById(rotated.userId);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  const accessToken = signAccessToken(user);
  res.cookie(REFRESH_COOKIE, rotated.newToken, cookieOptions);
  res.json(ApiResponse.success({ accessToken }, 'Token refreshed'));
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.json(ApiResponse.success(null, 'Logged out'));
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw ApiError.notFound('User not found');
  res.json(ApiResponse.success(user));
});
