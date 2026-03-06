import mongoose, { Schema, Document, Model } from 'mongoose';

export type AppointmentStatus = 'Pending' | 'Completed' | 'Missed' | 'Cancelled';

export interface IAppointmentDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  dentistId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  date: string;       // stored as "YYYY-MM-DD" for easy querying
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  status: AppointmentStatus;
  reason: string;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    dentistId: { type: Schema.Types.ObjectId, ref: 'Dentist', required: true },
    branchId:  { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date:      { type: String, required: true },   // "YYYY-MM-DD"
    startTime: { type: String, required: true },   // "HH:MM"
    endTime:   { type: String, required: true },   // "HH:MM"
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Missed', 'Cancelled'],
      default: 'Pending',
    },
    reason:    { type: String, required: true, trim: true },
    notes:     { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

/**
 * Compound index for double-booking prevention:
 * A dentist cannot have two ACTIVE appointments with the same date+startTime.
 */
AppointmentSchema.index(
  { dentistId: 1, date: 1, startTime: 1, status: 1 },
  { unique: false } // We enforce uniqueness in application logic for more flexibility
);

// General query indexes - OPTIMIZED for common queries
AppointmentSchema.index({ date: 1, branchId: 1 });
AppointmentSchema.index({ patientId: 1, date: -1 });
AppointmentSchema.index({ dentistId: 1, date: 1, status: 1 }); // For dentist schedules
AppointmentSchema.index({ branchId: 1, date: 1 }); // For branch filtering
AppointmentSchema.index({ status: 1, date: 1 }); // For status reports
// Index for time-range queries (used in conflict detection)
AppointmentSchema.index({ dentistId: 1, date: 1, startTime: 1 });

const Appointment: Model<IAppointmentDocument> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default Appointment;
