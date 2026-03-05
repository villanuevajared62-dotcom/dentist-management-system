/**
 * Database seed script
 * Run: npx ts-node --project tsconfig.seed.json src/lib/seed.ts
 *
 * Creates:
 * - 2 branches
 * - 3 users (admin, staff, dentist)
 * - 1 dentist profile
 * - 2 sample patients
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Inline models to avoid ESM/CJS issues in seed
import('../models/User').then(async ({ default: User }) => {
  const { default: Branch } = await import('../models/Branch');
  const { default: Dentist } = await import('../models/Dentist');
  const { default: Patient } = await import('../models/Patient');

  const MONGODB_URI = process.env.MONGODB_URI!;
  if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@ilovedentist.com', 'staff@ilovedentist.com', 'dentist@ilovedentist.com'] } }),
    Branch.deleteMany({ name: { $in: ['Main Branch', 'North Branch'] } }),
  ]);

  // Create branches
  const [mainBranch, northBranch] = await Branch.create([
    { name: 'Main Branch', address: '123 Dental Street', city: 'Manila', phone: '+63 2 8123 4567', email: 'main@ilovedentist.com' },
    { name: 'North Branch', address: '456 Tooth Avenue', city: 'Quezon City', phone: '+63 2 8765 4321', email: 'north@ilovedentist.com' },
  ]);
  console.log('✅ Branches created');

  // Create users
  const [adminUser, staffUser, dentistUser] = await User.create([
    { name: 'Admin User', email: 'admin@ilovedentist.com', password: 'Admin1234!', role: 'admin' },
    { name: 'Staff Member', email: 'staff@ilovedentist.com', password: 'Staff1234!', role: 'staff', branchId: mainBranch._id },
    { name: 'Dr. Maria Santos', email: 'dentist@ilovedentist.com', password: 'Dentist1234!', role: 'dentist', branchId: mainBranch._id },
  ]);
  console.log('✅ Users created');

  // Create dentist profile
  await Dentist.create({
    userId: dentistUser._id,
    branchId: mainBranch._id,
    specialty: 'General Dentistry',
    licenseNumber: 'PRC-DENT-2024-001',
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Mon
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tue
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wed
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thu
      { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' }, // Fri
    ],
  });
  console.log('✅ Dentist profile created');

  // Sample patients
  await Patient.create([
    {
      firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com',
      phone: '09171234567', dateOfBirth: new Date('1990-05-15'),
      gender: 'Male', address: '789 Patient St, Manila',
      medicalHistory: 'Hypertension', allergies: 'Penicillin',
      registeredBy: staffUser._id,
    },
    {
      firstName: 'Maria', lastName: 'Reyes', email: 'maria@example.com',
      phone: '09189876543', dateOfBirth: new Date('1985-11-22'),
      gender: 'Female', address: '321 Smile Blvd, QC',
      medicalHistory: 'None', allergies: 'None',
      registeredBy: staffUser._id,
    },
  ]);
  console.log('✅ Patients created');

  console.log('\n🦷 Seed complete! Login credentials:');
  console.log('   Admin:   admin@ilovedentist.com / Admin1234!');
  console.log('   Staff:   staff@ilovedentist.com / Staff1234!');
  console.log('   Dentist: dentist@ilovedentist.com / Dentist1234!');

  await mongoose.disconnect();
  process.exit(0);
});
