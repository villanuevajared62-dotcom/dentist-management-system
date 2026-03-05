import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IDentistDocument extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  specialty: string;
  licenseNumber: string;
  schedule: IScheduleSlot[];
  isActive: boolean;
}

const ScheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
  },
  { _id: false }
);

const DentistSchema = new Schema<IDentistDocument>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    branchId:      { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    specialty:     { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    schedule:      { type: [ScheduleSlotSchema], default: [] },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Dentist: Model<IDentistDocument> =
  mongoose.models.Dentist || mongoose.model<IDentistDocument>('Dentist', DentistSchema);

export default Dentist;
