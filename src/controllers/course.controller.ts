import { Request, Response, NextFunction } from 'express';
import { Course, ICourse, CourseLevel } from '../models/course.model';
import TagModel from '../models/tag.model';
import mongoose, { Types } from 'mongoose';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

interface AuthenticatedRequest<
  P = Record<string, unknown>,
  ResBody = Record<string, unknown>,
  ReqBody = Record<string, unknown>,
  ReqQuery = Record<string, unknown>
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: AuthenticatedUser;
}

interface CourseRequestBody {
  title: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  level: CourseLevel;
  published?: boolean;
  tags?: string[];
}

interface FavoriteResponseData {
  isFavorite: boolean;
  favoritesCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const getCourses = async (
  req: Request,
  res: Response<ApiResponse<ICourse[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await Course.find().populate('author tags');
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<ICourse>>,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id).populate('author tags');
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (
  req: AuthenticatedRequest<Record<string, unknown>, Record<string, unknown>, CourseRequestBody>,
  res: Response<ApiResponse<ICourse>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, price, image, category, level, published = false, tags = [] } = req.body;
    
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tagIds: Types.ObjectId[] = await Promise.all(
      tags.map(async (tagName: string) => {
        const tag = await TagModel.findOneAndUpdate(
          { name: tagName.trim() },
          { $setOnInsert: { name: tagName.trim() } },
          { upsert: true, new: true }
        );
        return tag._id as Types.ObjectId;
      })
    );

    const courseData: Omit<ICourse, 'slug' | 'createdAt' | '_id' | keyof mongoose.Document> = {
      title,
      description,
      price,
      image,
      category,
      level,
      published,
      author: new Types.ObjectId(req.user.userId),
      tags: tagIds,
      favorites: []
    };

    const course = await Course.createWithSlug(courseData);
    const populatedCourse = await course.populate(['author', 'tags']);
    
    res.status(201).json({ 
      success: true,
      data: populatedCourse
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: AuthenticatedRequest<{ id: string }, Record<string, unknown>, Partial<CourseRequestBody>>,
  res: Response<ApiResponse<ICourse>>,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('author tags');
    
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response<ApiResponse<FavoriteResponseData>>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const userId = new Types.ObjectId(req.user.userId);
    const index = course.favorites.indexOf(userId);

    if (index === -1) {
      course.favorites.push(userId);
    } else {
      course.favorites.splice(index, 1);
    }

    await course.save();
    
    res.status(200).json({ 
      success: true, 
      data: { 
        isFavorite: index === -1,
        favoritesCount: course.favorites.length 
      } 
    });
  } catch (error) {
    next(error);
  }
};