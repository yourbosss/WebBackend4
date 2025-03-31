import express from 'express';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import courseRouter from './routes/course.routes'; // Add this line
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import path from 'path';

const app = express();

// Middleware for JSON and logging
app.use(express.json());
app.use(loggingMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter); // Add this line

// Error handling middleware
app.use(errorHandlerMiddleware);

export default app;