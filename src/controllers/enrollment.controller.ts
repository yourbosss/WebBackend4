import { Request, Response, NextFunction } from 'express';
import { Enrollment, IEnrollment } from '../models/enrollment.model';
import { Lesson } from '../models/lesson.model';
import { AuthenticatedRequest } from '../types/express';
import { Types } from 'mongoose';

async function recalculateProgress(enrollment: IEnrollment) {
  const totalLessons = await Lesson.countDocuments({ courseId: enrollment.courseId });
  const completedLessons = enrollment.completedLessonIds.length;
  enrollment.progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
}

export const enrollOnCourse = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const existingEnrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (existingEnrollment) {
      res.status(400).json({ message: 'Already enrolled in this course' });
      return;
    }

    const enrollment = new Enrollment({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      completedLessonIds: [],
      progress: 0,
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
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    await recalculateProgress(enrollment);
    await enrollment.save();

    res.status(200).json({ success: true, data: { progress: enrollment.progress } });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (
  req: AuthenticatedRequest & Request<{ courseId: string; lessonId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    const lessonObjectId = new Types.ObjectId(lessonId);

    if (!enrollment.completedLessonIds.some(id => id.equals(lessonObjectId))) {
      enrollment.completedLessonIds.push(lessonObjectId);
      await recalculateProgress(enrollment);
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
): Promise<void> => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    enrollment.completedLessonIds = enrollment.completedLessonIds.filter(
      id => !id.equals(new Types.ObjectId(lessonId))
    );

    await recalculateProgress(enrollment);
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
): Promise<void> => {
  try {
    const courseId = req.params.courseId;

    const count = await Enrollment.countDocuments({ courseId: new Types.ObjectId(courseId) });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

export const completeCourse = async (
  req: AuthenticatedRequest & Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const enrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    const lessons = await Lesson.find({ courseId: new Types.ObjectId(courseId) }).select('_id');

    lessons.forEach(lesson => {
      const lessonId = lesson._id as Types.ObjectId;
      if (!enrollment.completedLessonIds.some(id => id.equals(lessonId))) {
        enrollment.completedLessonIds.push(lessonId);
      }
    });

    await recalculateProgress(enrollment);
    await enrollment.save();

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};
