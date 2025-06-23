import mongoose from 'mongoose';
import { Course } from './course.model';

export interface ILesson extends mongoose.Document {
  title: string;
  content?: string;
  videoUrl?: string;
  courseId: mongoose.Types.ObjectId;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new mongoose.Schema<ILesson>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: (value: string) => {
        return !value || /^(http|https):\/\/[^ "]+$/.test(value);
      },
      message: 'Invalid URL format'
    }
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
    validate: {
      validator: async (value: mongoose.Types.ObjectId) => {
        const course = await Course.findById(value);
        return !!course;
      },
      message: 'Course does not exist'
    }
  },
  order: {
    type: Number,
    min: [1, 'Order must be at least 1']
  }
}, {
  timestamps: true
});

lessonSchema.pre<ILesson>('save', async function (next) {
  if (!this.order) {
    const maxOrderLesson = await Lesson.findOne({ courseId: this.courseId })
      .sort('-order')
      .select('order');
    this.order = (maxOrderLesson?.order ?? 0) + 1;
  }
  next();
});

export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema);
