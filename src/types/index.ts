// ============================================================
// CORE TYPE DEFINITIONS
// ============================================================

export type UserRole = 'admin' | 'staff' | 'dentist';

export type AppointmentStatus = 'Pending' | 'Completed' | 'Missed' | 'Cancelled';

// ============================================================
// USER
// ============================================================
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// BRANCH
// ============================================================
export interface IBranch {
  _id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DENTIST
// ============================================================
export interface IDentist {
  _id: string;
  userId: string | IUser;
  branchId: string | IBranch;
  specialty: string;
  licenseNumber: string;
  schedule: {
    dayOfWeek: number; // 0=Sun, 1=Mon ... 6=Sat
    startTime: string; // "09:00"
    endTime: string;   // "17:00"
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PATIENT
// ============================================================
export interface IPatient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  medicalHistory: string;
  allergies: string;
  registeredBy: string | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// APPOINTMENT
// ============================================================
export interface IAppointment {
  _id: string;
  patientId: string | IPatient;
  dentistId: string | IDentist;
  branchId: string | IBranch;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "09:00"
  endTime: string;     // "09:30"
  status: AppointmentStatus;
  reason: string;
  notes: string;
  createdBy: string | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// API RESPONSE SHAPES
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// ============================================================
// NEXT-AUTH SESSION EXTENSION
// ============================================================
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      branchId?: string;
    };
  }
  interface User {
    id: string;
    role: UserRole;
    branchId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    branchId?: string;
  }
}
