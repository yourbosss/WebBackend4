import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateToken } from '../utils/generateToken';

interface MongoError extends Error {
  code?: number;
}

const isAlpha = (str: string): boolean => /^[A-Za-zА-Яа-яЁё]+$/.test(str);

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, username, password, role } = req.body;

  if (!isAlpha(firstName) || !isAlpha(lastName)) {
    res.status(400).json({ message: 'Имя и фамилия должны содержать только буквы.' });
    return;
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      return;
    }

    // Исправленное использование строки
    const user = new User({ 
      firstName, 
      lastName, 
      username, 
      password, 
      role // Строка (например, "admin")
    });

    await user.save();
    const token = generateToken(user._id.toString(), user.role); // Строка
    res.status(201).json({ token });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    const mongoError = error as MongoError;

    if (mongoError.code === 11000) {
      res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
    }
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    res.status(200).json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Пользователь не аутентифицирован' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля пользователя' });
  }
};
