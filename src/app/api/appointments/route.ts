import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import Dentist from '@/models/Dentist';
import Patient from '@/models/Patient';
import { AppointmentSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';
import { addMinutes, sanitizeInput } from '@/lib/utils';

// GET /api/appointments
// Query params: date, branchId, dentistId, patientId, status, search
export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const filter: Record<string, unknown> = {};

  if (searchParams.get('date'))      filter.date      = searchParams.get('date');
  if (searchParams.get('branchId'))  filter.branchId  = searchParams.get('branchId');
  if (searchParams.get('patientId')) filter.patientId = searchParams.get('patientId');
  if (searchParams.get('status'))    filter.status    = searchParams.get('status');

  // Connect to database once at the start
  await connectDB();

  // Search by patient name (firstName or lastName) using regex
  const searchQuery = searchParams.get('search');
  if (searchQuery) {
    const matchedPatients = await Patient.find({
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
      ],
    }).select('_id').lean();

    const patientIds = matchedPatients.map((p: any) => p._id);
    if (patientIds.length === 0) {
      return successResponse([]);
    }
    filter.patientId = { $in: patientIds };
  }

  // Dentist role: only see their own appointments
  if (session!.user.role === 'dentist') {
    const dentist = await Dentist.findOne({ userId: session!.user.id });
    if (dentist) {
      // Search by dentist profile ID
      filter.dentistId = dentist._id;
    } else {
      // No profile - return empty array (can't see any appointments)
      filter.dentistId = null;
    }
  } else if (searchParams.get('dentistId')) {
    filter.dentistId = searchParams.get('dentistId');
  }

  // Date range support: ?dateFrom=&dateTo=
  if (searchParams.get('dateFrom') || searchParams.get('dateTo')) {
    const dateRange: Record<string, string> = {};
    if (searchParams.get('dateFrom')) dateRange.$gte = searchParams.get('dateFrom')!;
    if (searchParams.get('dateTo'))   dateRange.$lte = searchParams.get('dateTo')!;
    filter.date = dateRange;
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'firstName lastName phone')
    .populate({ path: 'dentistId', populate: { path: 'userId', select: 'name' } })
    .populate('branchId', 'name city')
    .sort({ date: 1, startTime: 1 });

  return successResponse(appointments);
}

// POST /api/appointments — staff, admin
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession(['admin', 'staff']);
  if (error) return error;

  const body = await req.json();
  const parsed = AppointmentSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  // Server-side check: prevent booking on past dates (backup for client validation)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(parsed.data.date);
  appointmentDate.setHours(0, 0, 0, 0);
  
  if (appointmentDate < today) {
    return errorResponse('Cannot book an appointment on a past date', 400);
  }

  await connectDB();

  let { dentistId, date, startTime, duration } = parsed.data;
  const endTime = addMinutes(startTime, parseInt(duration));

  // ─── AUTO-CREATE DENTIST PROFILE IF NEEDED ─────────────────────
  // Check if dentist profile exists for this dentistId
  let dentistProfile = await Dentist.findById(dentistId);
  
  if (!dentistProfile) {
    // Try to find by userId - maybe it's stored as user ID
    dentistProfile = await Dentist.findOne({ userId: dentistId });
    
    if (!dentistProfile) {
      // Profile doesn't exist - we need to create one automatically
      // But we need user info - fetch from the dentist selection
      // For now, create a basic profile
      return errorResponse(
        'Dentist profile does not exist. Please create a dentist profile first in the Dentists page.',
        400
      );
    }
    // Use the found profile's ID
    dentistId = dentistProfile._id.toString();
  }

  // Check if dentist is active
  if (!dentistProfile.isActive) {
    return errorResponse('This dentist is no longer available', 400);
  }

  // ─── DOUBLE BOOKING CHECK (OPTIMIZED) ────────────────────────
  // Reject if dentist already has a Pending/Completed appointment in overlapping slot
  // OPTIMIZATION: Filter at database level instead of loading all and filtering in memory
  
  const startTimeMinutes = parseInt(startTime.replace(':', ''));
  const endTimeMinutes = parseInt(endTime.replace(':', ''));
  
  // First, get appointments that could potentially overlap (within 2-hour window)
  // This reduces the number of documents loaded from DB significantly
  const potentialConflicts = await Appointment.find({
    dentistId,
    date,
    status: { $in: ['Pending', 'Completed'] },
    startTime: { 
      $gte: String(Math.max(0, startTimeMinutes - 200)).padStart(4, '0'),
      $lte: String(Math.min(2359, endTimeMinutes + 200)).padStart(4, '0')
    }
  }).select('startTime endTime');

  // Check for time overlap using numeric comparison (on smaller dataset)
  const conflict = potentialConflicts.find((appt: any) => {
    const apptStart = parseInt(appt.startTime.replace(':', ''));
    const apptEnd = parseInt(appt.endTime.replace(':', ''));
    
    // Check overlap: new appointment starts before existing ends AND ends after existing starts
    return startTimeMinutes < apptEnd && endTimeMinutes > apptStart;
  });

  if (conflict) {
    return errorResponse(
      `Time slot ${startTime}–${endTime} is already booked for this dentist.`,
      409
    );
  }

  // Sanitize input fields to prevent XSS and injection attacks
  const sanitizedData = {
    ...parsed.data,
    notes: sanitizeInput(parsed.data.notes),
    reason: sanitizeInput(parsed.data.reason),
  };

  const appointment = await Appointment.create({
    ...sanitizedData,
    endTime,
    createdBy: session!.user.id,
  });

  // Create audit log entry
  await createAuditLog(
    'CREATE',
    'Appointment',
    session!.user.id,
    `Created appointment for ${parsed.data.date} at ${parsed.data.startTime} - ${parsed.data.reason}`
  );

  const populated = await appointment.populate([
    { path: 'patientId', select: 'firstName lastName phone' },
    { path: 'dentistId', populate: { path: 'userId', select: 'name' } },
    { path: 'branchId', select: 'name city' },
  ]);

  return successResponse(populated, 201);
}
