import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import { User } from '../models/user.model'; 
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import { UserRole } from '../models/user.model';

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role?: UserRole;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const registerUser = async (
  req: Request<Record<string, never>, object, RegisterRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      role: role || 'student',
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.params.id);
    const user = await User.findByIdAndDelete(userObjectId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user?.userId as string);
    const user = await User.findById(userObjectId)
      .select('-password')
      .populate('favoriteCourseIds');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (
  req: Request<{ courseId: string }, unknown, unknown, unknown> & { user?: { userId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const course = await Course.findById(courseObjectId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const favoriteIndex = user.favoriteCourseIds.findIndex((fav: mongoose.Types.ObjectId) => fav.toString() === courseObjectId.toString());

    if (favoriteIndex === -1) {
      user.favoriteCourseIds.push(courseObjectId);
      course.favoriteUserIds.push(userObjectId);
    } else {
      user.favoriteCourseIds.splice(favoriteIndex, 1);
      const userIndexInCourse = course.favoriteUserIds.findIndex((fav: mongoose.Types.ObjectId) => fav.toString() === userObjectId.toString());
      if (userIndexInCourse !== -1) {
        course.favoriteUserIds.splice(userIndexInCourse, 1);
      }
    }

    await Promise.all([user.save(), course.save()]);

    res.json({
      message: favoriteIndex === -1 ? 'Course added to favorites' : 'Course removed from favorites',
      favorites: user.favoriteCourseIds,
    });
  } catch (error) {
    next(error);
  }
};

export const getCreatedCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const courses = await Course.find({ authorId: req.user.userId });
    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};
