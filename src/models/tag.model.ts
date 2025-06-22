import mongoose from 'mongoose';

export interface ITag extends mongoose.Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tag name is required'], 
    unique: true,
    trim: true,
    maxlength: [30, 'Tag name cannot exceed 30 characters'],
    minlength: [2, 'Tag name must be at least 2 characters']
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

tagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
