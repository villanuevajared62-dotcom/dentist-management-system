import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Patient from '@/models/Patient';
import { PatientSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';
import { sanitizeInput, sanitizeName } from '@/lib/utils';

// GET /api/patients — staff, admin, dentist
export async function GET(req: NextRequest) {
  const { session, error } = await requireSession(['admin', 'staff', 'dentist']);
  if (error) return error;

  const search = req.nextUrl.searchParams.get('search');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
  
  const query: Record<string, unknown> = { isActive: true };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' }, isActive: true },
      { lastName:  { $regex: search, $options: 'i' }, isActive: true },
      { phone:     { $regex: search, $options: 'i' }, isActive: true },
      { email:     { $regex: search, $options: 'i' }, isActive: true },
    ];
  }

  await connectDB();
  
  const total = await Patient.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  
  const skip = (page - 1) * limit;
  const patients = await Patient.find(query)
    .populate('registeredBy', 'name')
    .sort({ lastName: 1, firstName: 1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({
    success: true,
    data: patients,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}

// POST /api/patients — staff, admin
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession(['admin', 'staff']);
  if (error) return error;

  const body = await req.json();
  const parsed = PatientSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();

  const existingByPhone = await Patient.findOne({ phone: parsed.data.phone });
  if (existingByPhone) {
    return errorResponse('A patient with this phone number already exists', 409);
  }

  if (parsed.data.email) {
    const existingByEmail = await Patient.findOne({ email: parsed.data.email.toLowerCase() });
    if (existingByEmail) {
      return errorResponse('A patient with this email already exists', 409);
    }
  }

  const sanitizedData = {
    ...parsed.data,
    email: parsed.data.email?.toLowerCase(),
    firstName: sanitizeName(parsed.data.firstName),
    lastName: sanitizeName(parsed.data.lastName),
    address: sanitizeInput(parsed.data.address),
    medicalHistory: sanitizeInput(parsed.data.medicalHistory),
    allergies: sanitizeInput(parsed.data.allergies),
  };

  const patient = await Patient.create({ ...sanitizedData, registeredBy: session!.user.id });

  await createAuditLog(
    'CREATE',
    'Patient',
    session!.user.id,
    `Registered new patient: ${parsed.data.firstName} ${parsed.data.lastName} (Phone: ${parsed.data.phone})`
  );

  return successResponse(patient, 201);
}