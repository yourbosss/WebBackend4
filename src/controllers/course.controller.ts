import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import TagModel from '../models/tag.model';
import User from '../models/user.model';
import { Types } from 'mongoose';
import { UserRole } from '../models/user.model';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

interface CourseRequestBody {
  title: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  level: string;
  published?: boolean;
  tags?: string[];
}

interface GetCoursesQueryParams {
  category?: string;
  level?: string;
  priceMin?: string;
  priceMax?: string;
  tags?: string;
  author?: string;
  published?: string;
  favorites?: string;
  search?: string;
  sortBy?: string;
  page?: string;
  limit?: string;
}

type PriceQuery = {
  $gte?: number;
  $lte?: number;
};

type QueryType = {
  category?: string;
  level?: string;
  price?: PriceQuery;
  tags?: { $in: Types.ObjectId[] };
  author?: Types.ObjectId;
  published?: boolean;
  title?: { $regex: string; $options: string };
  _id?: { $in: Types.ObjectId[] };
};

type EmptyObject = Record<string, never>;

export const getCourses = async (
  req: Request<EmptyObject, EmptyObject, EmptyObject, GetCoursesQueryParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      category,
      level,
      priceMin,
      priceMax,
      tags,
      author,
      published,
      favorites,
      search,
      sortBy = '-createdAt',
      page = '1',
      limit = '10',
    } = req.query;

    const query: QueryType = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (published) query.published = published === 'true';

    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }

    if (tags) {
      const tagNames = tags.split(',');
      const tagIds = await TagModel.find({ name: { $in: tagNames } }).select('_id');
      query.tags = { $in: tagIds.map(tag => tag._id as Types.ObjectId) };
    }

    if (author) {
      query.author = new Types.ObjectId(author);
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (favorites === 'true' && req.user?.userId) {
      const user = await User.findById(req.user.userId);
      if (user) {
        query._id = { $in: user.favorites };
      }
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limitNumber)
        .populate('author tags'),
      Course.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (
  req: Request<{ id: string }>,
  res: Response,
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
  req: AuthenticatedRequest & { body: CourseRequestBody },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, price, image, category, level, published = false, tags = [] } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tagIds = await Promise.all(
      tags.map(async (tagName: string) => {
        const tag = await TagModel.findOneAndUpdate(
          { name: tagName.trim() },
          { $setOnInsert: { name: tagName.trim() } },
          { upsert: true, new: true }
        );
        return tag._id as Types.ObjectId;
      })
    );

    const courseData = {
      title,
      description,
      price,
      image,
      category,
      level,
      published,
      author: new Types.ObjectId(req.user.userId),
      tags: tagIds,
      favorites: [],
    };

    const course = await Course.create(courseData);
    const populatedCourse = await course.populate(['author', 'tags']);

    res.status(201).json({ success: true, data: populatedCourse });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: AuthenticatedRequest & { body: Partial<CourseRequestBody> },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { tags, ...rest } = req.body;

    const updateData: Partial<CourseRequestBody & { tags?: Types.ObjectId[] }> = { ...rest };

    if (tags) {
      const tagIds = await Promise.all(
        tags.map(async (tagName: string) => {
          const tag = await TagModel.findOneAndUpdate(
            { name: tagName.trim() },
            { $setOnInsert: { name: tagName.trim() } },
            { upsert: true, new: true }
          );
          return tag._id as Types.ObjectId;
        })
      );
      updateData.tags = tagIds;
    }

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true }).populate('author tags');

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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};

interface ToggleFavoriteResponse {
  success: boolean;
  data?: {
    isFavorite: boolean;
    favoritesCount: number;
  };
  message?: string;
}

export const toggleFavorite = async (
  req: AuthenticatedRequest,
  res: Response<ToggleFavoriteResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const course = await Course.findById(id);

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
        favoritesCount: course.favorites.length,
      },
    });
  } catch (error) {
    next(error);
  }
};