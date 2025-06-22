import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { generateToken } from '../utils/generateToken';
import { UserRole } from '../models/user.model';

interface IUser {
  _id: string;
  username: string;
  password: string;
  role: UserRole;
}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).lean() as IUser | null;

    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
