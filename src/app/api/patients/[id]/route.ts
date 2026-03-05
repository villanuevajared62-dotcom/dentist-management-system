import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Patient from '@/models/Patient';
import { PatientSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';

// GET /api/patients/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(['admin', 'staff', 'dentist']);
  if (error) return error;

  await connectDB();
  const patient = await Patient.findById(params.id).populate('registeredBy', 'name');
  if (!patient) return errorResponse('Patient not found', 404);
  return successResponse(patient);
}

// PATCH /api/patients/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin', 'staff']);
  if (error) return error;

  const body = await req.json();
  const parsed = PatientSchema.partial().safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const patient = await Patient.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!patient) return errorResponse('Patient not found', 404);

  // Create audit log entry
  const changes = Object.keys(parsed.data).join(', ');
  await createAuditLog(
    'UPDATE',
    'Patient',
    session!.user.id,
    `Updated patient ${params.id}: ${changes}`
  );

  return successResponse(patient);
}

// DELETE /api/patients/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin', 'staff']);
  if (error) return error;

  await connectDB();
  await Patient.findByIdAndUpdate(params.id, { isActive: false });

  // Create audit log entry
  await createAuditLog(
    'DELETE',
    'Patient',
    session!.user.id,
    `Deactivated patient ${params.id}`
  );

  return successResponse({ message: 'Patient deactivated' });
}
