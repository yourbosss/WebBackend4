import { Request, Response, NextFunction } from 'express';
import { Lesson } from '../models/lesson.model';
import { Course } from '../models/course.model';
import { AuthenticatedRequest } from '../types/express';
import mongoose from 'mongoose';

interface LessonRequestBody {
  title: string;
  content?: string;
  videoUrl?: string;
  order?: number;
}

export const getLessons = async (
  req: Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const lessons = await Lesson.find({ courseId })
      .sort('order')
      .populate('courseId', 'title');

    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('courseId', 'title');

    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (
  req: AuthenticatedRequest & Request<{ courseId: string }, Record<string, never>, LessonRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { courseId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (
      course.authorId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({ success: false, message: 'Not authorized to add lessons to this course' });
      return;
    }

    const lesson = await Lesson.create({
      title,
      content,
      videoUrl,
      courseId,
      order
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (
  req: AuthenticatedRequest & Request<{ id: string }, Record<string, never>, Partial<LessonRequestBody>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { title, content, videoUrl, order } = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    const course = await Course.findById(lesson.courseId);
    if (
      !course ||
      (course.authorId.toString() !== req.user.userId &&
        req.user.role !== 'admin')
    ) {
      res.status(403).json({ success: false, message: 'Not authorized to update this lesson' });
      return;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      { title, content, videoUrl, order },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedLesson });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    const course = await Course.findById(lesson.courseId);
    if (
      !course ||
      (course.authorId.toString() !== req.user.userId &&
        req.user.role !== 'admin')
    ) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this lesson' });
      return;
    }

    await Lesson.deleteOne({ _id: id });
    await mongoose.model('Comment').deleteMany({ lessonId: id });

    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};
