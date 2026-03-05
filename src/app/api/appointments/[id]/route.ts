import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import { AppointmentUpdateSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';

// GET /api/appointments/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  await connectDB();
  const appt = await Appointment.findById(params.id)
    .populate('patientId')
    .populate({ path: 'dentistId', populate: { path: 'userId', select: 'name email' } })
    .populate('branchId', 'name city address phone');
  if (!appt) return errorResponse('Appointment not found', 404);
  return successResponse(appt);
}

// PATCH /api/appointments/[id] — update status or notes
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = AppointmentUpdateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  // Dentists can only update notes and mark completed/missed
  const role = session!.user.role;
  if (role === 'dentist') {
    const allowed = ['notes', 'status'];
    const keys = Object.keys(parsed.data);
    if (keys.some(k => !allowed.includes(k))) {
      return errorResponse('Dentists can only update notes and status', 403);
    }
    if (parsed.data.status && !['Completed', 'Missed'].includes(parsed.data.status)) {
      return errorResponse('Dentists can only set Completed or Missed', 403);
    }
  }

  await connectDB();
  const appt = await Appointment.findByIdAndUpdate(params.id, parsed.data, { new: true })
    .populate('patientId', 'firstName lastName')
    .populate({ path: 'dentistId', populate: { path: 'userId', select: 'name' } })
    .populate('branchId', 'name');
  if (!appt) return errorResponse('Appointment not found', 404);

  // Create audit log entry
  const changes = Object.keys(parsed.data).join(', ');
  await createAuditLog(
    'UPDATE',
    'Appointment',
    session!.user.id,
    `Updated appointment ${params.id}: ${changes}`
  );

  return successResponse(appt);
}

// DELETE /api/appointments/[id] — cancel (admin/staff only)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin', 'staff']);
  if (error) return error;

  await connectDB();
  const appt = await Appointment.findByIdAndUpdate(
    params.id,
    { status: 'Cancelled' },
    { new: true }
  );
  if (!appt) return errorResponse('Appointment not found', 404);

  // Create audit log entry
  await createAuditLog(
    'CANCEL',
    'Appointment',
    session!.user.id,
    `Cancelled appointment ${params.id}`
  );

  return successResponse({ message: 'Appointment cancelled' });
}
