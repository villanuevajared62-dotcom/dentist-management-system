import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Dentist from '@/models/Dentist';
import { DentistSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';

// PUT /api/dentists/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = DentistSchema.partial().safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const dentist = await Dentist.findByIdAndUpdate(params.id, parsed.data, { new: true })
    .populate('userId', 'name email')
    .populate('branchId', 'name city');
  if (!dentist) return errorResponse('Dentist not found', 404);
  const dentistUserName =
    typeof dentist.userId === 'object' &&
    dentist.userId !== null &&
    'name' in dentist.userId
      ? (dentist.userId as { name?: string }).name || 'Unknown'
      : 'Unknown';
  await createAuditLog(
    'UPDATE',
    'Dentist',
    session!.user.id,
    `Updated dentist profile for ${dentistUserName}`
  );
  return successResponse(dentist);
}

// DELETE /api/dentists/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();
  const dentist = await Dentist.findByIdAndUpdate(params.id, { isActive: false }, { new: true })
    .populate('userId', 'name email');
  if (!dentist) return errorResponse('Dentist not found', 404);
  const dentistUserName =
    typeof dentist.userId === 'object' &&
    dentist.userId !== null &&
    'name' in dentist.userId
      ? (dentist.userId as { name?: string }).name || 'Unknown'
      : 'Unknown';
  await createAuditLog(
    'DELETE',
    'Dentist',
    session!.user.id,
    `Deactivated dentist profile for ${dentistUserName}`
  );
  return successResponse({ message: 'Dentist deactivated' });
}
