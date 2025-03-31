import mongoose from 'mongoose';
import slugify from 'slugify';

export enum CourseLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced'
}

export interface ICourse extends mongoose.Document {
  title: string;
  slug: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  level: CourseLevel;
  published: boolean;
  author: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  favorites: mongoose.Types.ObjectId[];
  createdAt: Date;
}

interface CourseModel extends mongoose.Model<ICourse> {
  createWithSlug(courseData: Omit<ICourse, 'slug' | 'createdAt' | '_id' | keyof mongoose.Document>): Promise<ICourse>;
}

const courseSchema = new mongoose.Schema<ICourse, CourseModel>({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true
  },
  slug: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  image: { 
    type: String, 
    required: [true, 'Image is required'] 
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true 
  },
  level: { 
    type: String, 
    enum: Object.values(CourseLevel), 
    default: CourseLevel.Beginner,
    required: true 
  },
  published: { 
    type: Boolean, 
    default: false 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tags: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tag' 
  }],
  favorites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now,
    required: true 
  }
});

courseSchema.pre<ICourse>('validate', function(next) {
  if (!this.slug && this.title) {
    const baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      trim: true
    });
    this.slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

courseSchema.statics.createWithSlug = async function(courseData) {
  const baseSlug = slugify(courseData.title, {
    lower: true,
    strict: true,
    trim: true
  });
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  
  return this.create({ 
    ...courseData, 
    slug,
    createdAt: new Date()
  });
};

export const Course = mongoose.model<ICourse, CourseModel>('Course', courseSchema);