import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export const processImage = async (filePath: string): Promise<string> => {
  const outputPath = `uploads/processed_${path.basename(filePath)}`;
  
  await sharp(filePath)
    .resize(800, 600, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .composite([{
      input: Buffer.from(`
        <svg width="800" height="600">
          <text x="50%" y="50%" font-family="Arial" font-size="40" 
                fill="rgba(255,255,255,0.5)" text-anchor="middle">Course Image</text>
        </svg>
      `),
      blend: 'over'
    }])
    .toFile(outputPath);
  
  return outputPath;
};