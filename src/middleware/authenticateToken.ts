import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { UserRole } from '../models/user.model';

interface IUser {
  _id: string;
  username: string;
  password: string;
  role: UserRole;
}

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      role: UserRole;
    };
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      role: UserRole;
    };

    const user = await User.findById(decoded.userId).lean() as IUser | null;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    req.user = {
      userId: user._id,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
