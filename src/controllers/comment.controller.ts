import { Request, Response, NextFunction } from 'express';
import { Comment } from '../models/comment.model';
import { Lesson } from '../models/lesson.model';
import { AuthenticatedRequest } from '../types/express';

interface CommentRequestBody {
  text: string;
}

export const getComments = async (
  req: Request<{ lessonId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;

    const comments = await Comment.find({ lessonId })
      .sort('-createdAt')
      .populate('userId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (
  req: AuthenticatedRequest & Request<{ lessonId: string }, Record<string, never>, CommentRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { lessonId } = req.params;
    const { text } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    const comment = await Comment.create({
      userId: req.user.userId,
      lessonId,
      text
    });

    const populatedComment = await comment.populate('userId', 'firstName lastName');

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: AuthenticatedRequest & Request<{ id: string }, Record<string, never>, CommentRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.userId.toString() !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
      return;
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { text },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName');

    res.status(200).json({ success: true, data: updatedComment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
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

    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      return;
    }

    await Comment.deleteOne({ _id: id });

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};
