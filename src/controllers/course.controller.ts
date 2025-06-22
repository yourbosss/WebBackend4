import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import { Tag } from '../models/tag.model';
import { User } from '../models/user.model';
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
  tagIds?: { $in: string[] };
  authorId?: Types.ObjectId;
  published?: boolean;
  title?: { $regex: string; $options: string };
  _id?: { $in: string[] };
};

type EmptyObject = Record<string, never>;

const processTags = async (tags: string[]): Promise<string[]> => {
  const tagIds: string[] = [];
  for (const tagName of tags) {
    const tag = await Tag.findOneAndUpdate(
      { name: tagName.trim() },
      { $setOnInsert: { name: tagName.trim() } },
      { upsert: true, new: true }
    );
    tagIds.push((tag._id as Types.ObjectId).toString());
  }
  return tagIds;
};

const buildSearchQuery = (search?: string) => {
  if (!search) return {};
  return { title: { $regex: search, $options: 'i' } };
};

const buildPriceQuery = (priceMin?: string, priceMax?: string) => {
  const priceQuery: QueryType['price'] = {};
  if (priceMin) priceQuery.$gte = Number(priceMin);
  if (priceMax) priceQuery.$lte = Number(priceMax);
  return Object.keys(priceQuery).length > 0 ? { price: priceQuery } : {};
};

const buildPagination = (page: string, limit: string) => {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
  return {
    skip: (pageNumber - 1) * limitNumber,
    limit: limitNumber,
    page: pageNumber,
  };
};

const verifyAuthentication = (req: AuthenticatedRequest) => {
  if (!req.user?.userId) {
    throw new Error('Unauthorized');
  }
  return req.user.userId;
};

export const getCourses = async (
  req: Request<EmptyObject, EmptyObject, EmptyObject, GetCoursesQueryParams> & { user?: { userId: string; role: UserRole } },
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, level, priceMin, priceMax, tags, author, published, favorites, search, sortBy = '-createdAt', page = '1', limit = '10' } = req.query;

    const queryConditions: QueryType = {
      ...(category && { category }),
      ...(level && { level }),
      ...(published && { published: published === 'true' }),
      ...buildPriceQuery(priceMin, priceMax),
      ...buildSearchQuery(search),
    };

    if (tags) {
      const tagIds = await processTags(tags.split(','));
      queryConditions.tagIds = { $in: tagIds };
    }

    if (author) {
      queryConditions.authorId = new Types.ObjectId(author);
    }

    if (favorites === 'true' && req.user?.userId) {
      const user = await User.findById(req.user.userId);
      if (user && Array.isArray(user.favoriteCourseIds)) {
        const favIds = user.favoriteCourseIds.map(id => id.toString());
        queryConditions._id = { $in: favIds };
      }
    }

    const { skip, limit: limitNumber, page: pageNumber } = buildPagination(page, limit);

    const [courses, total] = await Promise.all([
      Course.find(queryConditions)
        .sort(sortBy)
        .skip(skip)
        .limit(limitNumber)
        .populate('authorId tagIds'),
      Course.countDocuments(queryConditions),
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
  req: Request<{ id: string }, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await Course.findById(req.params.id).populate('authorId tagIds');
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
) => {
  try {
    const userId = verifyAuthentication(req);
    const { tags = [], ...courseData } = req.body;

    const tagIds = await processTags(tags);

    const newCourse = await Course.create({
      ...courseData,
      authorId: new Types.ObjectId(userId),
      tagIds,
      favoriteUserIds: [],
    });

    const populatedCourse = await newCourse.populate(['authorId', 'tagIds']);
    res.status(201).json({ success: true, data: populatedCourse });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: AuthenticatedRequest & Request<{ id: string }, unknown, Partial<CourseRequestBody>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { tags, ...rest } = req.body;

    const updateData: Partial<CourseRequestBody & { tagIds?: string[] }> = { ...rest };

    if (tags) {
      const tagIds = await processTags(tags);
      updateData.tagIds = tagIds;
    }

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true }).populate('authorId tagIds');

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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
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

export const toggleFavorite = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = verifyAuthentication(req);
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const index = course.favoriteUserIds.findIndex(favId => favId.toString() === userId);

    if (index === -1) {
      course.favoriteUserIds.push(new Types.ObjectId(userId));
    } else {
      course.favoriteUserIds.splice(index, 1);
    }

    await course.save();

    res.status(200).json({
      success: true,
      data: {
        isFavorite: index === -1,
        favoritesCount: course.favoriteUserIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
