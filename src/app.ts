import express from 'express';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import courseRouter from './routes/course.routes';
import lessonRouter from './routes/lesson.routes';
import commentRouter from './routes/comment.routes';
import enrollmentRouter from './routes/enrollment.routes'; 
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import { authenticateToken } from './middleware/authenticateToken';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(loggingMiddleware); 

mongoose.connect(process.env.MONGODB_URI || '', {
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.use('/api/auth', authRouter);
app.use(authenticateToken);

app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/comments', commentRouter);
app.use('/api/enrollments', enrollmentRouter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(errorHandlerMiddleware);

export default app;
