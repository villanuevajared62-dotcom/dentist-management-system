import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatientDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  medicalHistory: string;
  allergies: string;
  registeredBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const PatientSchema = new Schema<IPatientDocument>(
  {
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, lowercase: true, trim: true, default: '' },
    phone:          { type: String, required: true, trim: true },
    dateOfBirth:    { type: Date, required: true },
    gender:         { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    address:        { type: String, trim: true, default: '' },
    medicalHistory: { type: String, default: '' },
    allergies:      { type: String, default: '' },
    registeredBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text search index on name/email
PatientSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });

// Unique index on phone to prevent duplicate patients
PatientSchema.index({ phone: 1 }, { unique: true });

// Additional indexes for common queries
PatientSchema.index({ isActive: 1 }); // Filter active patients
PatientSchema.index({ registeredBy: 1, createdAt: -1 }); // For registration reports

const Patient: Model<IPatientDocument> =
  mongoose.models.Patient || mongoose.model<IPatientDocument>('Patient', PatientSchema);

export default Patient;
