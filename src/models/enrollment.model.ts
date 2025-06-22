import mongoose from 'mongoose';

export interface IEnrollment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedLessonIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new mongoose.Schema<IEnrollment>({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  completedLessonIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: []
  }]
}, {
  timestamps: true
});


enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
