import mongoose from 'mongoose';
import app from './app';
import dotenv from 'dotenv';
import path from 'path'; 

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const port = process.env.PORT || 3000;
const dbUrl = process.env.MONGO_URL;

if (!dbUrl) {
  throw new Error('MONGO_URL is not set in .env file.');
}

const start = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

start();