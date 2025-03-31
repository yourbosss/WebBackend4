import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateToken } from '../utils/generateToken';

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Неверный логин или пароль' });
      return;
    }

    // Исправленный вызов с ролью
    const token = generateToken(user._id.toString(), user.role);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Ошибка при авторизации' });
  }
};
