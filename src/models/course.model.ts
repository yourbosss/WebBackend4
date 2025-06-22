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
  authorId: mongoose.Types.ObjectId;
  tagIds: mongoose.Types.ObjectId[];
  favoriteUserIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new mongoose.Schema<ICourse>({
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
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tagIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tag' 
  }],
  favoriteUserIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, {
  timestamps: true
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

export const Course = mongoose.model<ICourse>('Course', courseSchema);
