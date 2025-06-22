import mongoose from 'mongoose';
import { Lesson } from './lesson.model';
import { IUser } from './user.model';

export interface IComment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    validate: {
      validator: async (value: mongoose.Types.ObjectId) => {
        const user = await mongoose.model<IUser>('User').findById(value);
        return !!user;
      },
      message: 'User does not exist'
    }
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Lesson reference is required'],
    validate: {
      validator: async (value: mongoose.Types.ObjectId) => {
        const lesson = await Lesson.findById(value);
        return !!lesson;
      },
      message: 'Lesson does not exist'
    }
  },
  text: {
    type: String,
    required: [true, 'Text is required'],
    trim: true,
    maxlength: [255, 'Comment cannot exceed 255 characters'],
    minlength: [1, 'Comment must be at least 1 character']
  }
}, {
  timestamps: true
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
