import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthPayload } from './auth.middleware';

/**
 * Role-based access control. Usage: router.get('/', requireAuth, requireRole('admin'), handler)
 */
export const requireRole = (...roles: AuthPayload['role'][]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};
