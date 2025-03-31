import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'], // Строковый enum
    required: true,
    default: 'student'
  },
  favorites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }]
});

export default mongoose.model('User', userSchema);
