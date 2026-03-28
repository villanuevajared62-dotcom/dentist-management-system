/**
 * Zod validation schemas — used on both client and server
 */
import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── User / Account ──────────────────────────────────────────
export const UserCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'staff', 'dentist']),
  branchId: z.string().optional(),
});

export const UserUpdateSchema = UserCreateSchema.omit({ password: true }).partial();

export const PasswordResetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── Branch ──────────────────────────────────────────────────
export const BranchSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
});

// ─── Dentist ─────────────────────────────────────────────────
export const DentistSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  branchId: z.string().min(1, 'Branch is required'),
  specialty: z.string().min(2).max(100),
  licenseNumber: z.string().min(4).max(50),
  schedule: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  })).min(1, 'At least one schedule day is required'),
});

// ─── Patient ─────────────────────────────────────────────────
export const PatientSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^(09\d{9}|\+639\d{9})$/, 'Invalid PH mobile number'),
  dateOfBirth: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid date'),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().max(255).optional(),
  medicalHistory: z.string().max(2000).optional(),
  allergies: z.string().max(500).optional(),
});

// ─── Appointment ─────────────────────────────────────────────
export const AppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  dentistId: z.string().min(1, 'Dentist is required'),
  branchId: z.string().min(1, 'Branch is required'),
  date: z.string()
    .refine(d => !isNaN(Date.parse(d)), 'Invalid date')
    .refine(d => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(d);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    }, 'Cannot book an appointment on a past date'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  duration: z.enum(['30', '60', '90', '120']).default('30'),
  reason: z.string().min(3, 'Reason is required').max(300),
  notes: z.string().max(1000).optional(),
});

export const AppointmentUpdateSchema = z.object({
  status: z.enum(['Pending', 'Completed', 'Missed', 'Cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  date: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dentistId: z.string().optional(),
  branchId: z.string().optional(),
});
