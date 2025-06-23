import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEnrollment extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedLessonIds: Types.ObjectId[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  completedLessonIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  }
}, { timestamps: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
