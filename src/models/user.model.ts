import mongoose from 'mongoose';

export type UserRole = 'student' | 'teacher' | 'admin';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'] as const,
    required: true,
    default: 'student'
  },
  favoriteCourseIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }]
}, {
  timestamps: true
});

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: UserRole;
  favoriteCourseIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const User = mongoose.model<IUser>('User', userSchema);
