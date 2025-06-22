import { Request, Response, NextFunction } from 'express';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { AuthenticatedRequest } from '../types/express';
import { Types } from 'mongoose';

export const enrollOnCourse = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
    if (existingEnrollment) {
      res.status(400).json({ message: 'Already enrolled in this course' });
      return;
    }

    const enrollment = new Enrollment({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      completedLessonIds: []
    });

    await enrollment.save();

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    const lessonsCount = await Lesson.countDocuments({ courseId });
    const completedCount = enrollment.completedLessonIds.length;

    const progress = lessonsCount === 0 ? 0 : (completedCount / lessonsCount) * 100;

    res.status(200).json({ success: true, data: { progress } });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (
  req: AuthenticatedRequest & Request<{ courseId: string; lessonId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    const lessonObjectId = new Types.ObjectId(lessonId);

    if (!enrollment.completedLessonIds.some(id => id.equals(lessonObjectId))) {
      enrollment.completedLessonIds.push(lessonObjectId);
      await enrollment.save();
    }

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const undoCompleteLesson = async (
  req: AuthenticatedRequest & Request<{ courseId: string; lessonId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    enrollment.completedLessonIds = enrollment.completedLessonIds.filter(
      (id) => id.toString() !== lessonId
    );

    await enrollment.save();

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const countStudentsOnCourse = async (
  req: Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;

    const count = await Enrollment.countDocuments({ courseId });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};
