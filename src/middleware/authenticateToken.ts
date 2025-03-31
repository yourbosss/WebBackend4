import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      role: string; // Строка вместо enum
    };
  }
}

interface DecodedToken {
  userId: string;
  role: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header is missing' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Invalid token format' });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: Error | null, decoded: unknown) => {
      if (err) {
        console.error('Token verification error:', err.message);
        res.status(403).json({ message: 'Invalid or expired token' });
        return;
      }

      const payload = decoded as DecodedToken;

      // Проверка роли как строки
      if (!['student', 'teacher', 'admin'].includes(payload.role)) {
        res.status(403).json({ message: 'Invalid user role' });
        return;
      }

      req.user = {
        userId: payload.userId,
        role: payload.role // Строка
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};
