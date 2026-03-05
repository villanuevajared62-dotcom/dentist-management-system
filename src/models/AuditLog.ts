import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';
export type AuditModule = 'Appointment' | 'Patient' | 'User' | 'Branch' | 'Dentist';

export interface IAuditLogDocument extends Document {
  action: AuditAction;
  module: AuditModule;
  performedBy: mongoose.Types.ObjectId;
  details: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: { 
      type: String, 
      enum: ['CREATE', 'UPDATE', 'DELETE', 'CANCEL'], 
      required: true 
    },
    module: { 
      type: String, 
      enum: ['Appointment', 'Patient', 'User', 'Branch', 'Dentist'], 
      required: true 
    },
    performedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    details: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for efficient querying
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1 });

const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLog;

