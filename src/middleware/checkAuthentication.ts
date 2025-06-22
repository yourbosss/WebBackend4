import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';

export const checkAuthentication = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  next();
};
