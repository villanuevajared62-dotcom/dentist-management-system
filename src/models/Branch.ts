import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranchDocument extends Document {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const BranchSchema = new Schema<IBranchDocument>(
  {
    name:     { type: String, required: true, trim: true },
    address:  { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    email:    { type: String, required: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Branch: Model<IBranchDocument> =
  mongoose.models.Branch || mongoose.model<IBranchDocument>('Branch', BranchSchema);

export default Branch;
