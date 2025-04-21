import express from 'express';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import courseRouter from './routes/course.routes';
import lessonRouter from './routes/lesson.routes';
import commentRouter from './routes/comment.routes';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import path from 'path';

const app = express();

app.use(express.json());
app.use(loggingMiddleware);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/courses', lessonRouter);
app.use('/api/lessons', commentRouter);

app.use(errorHandlerMiddleware);

export default app;