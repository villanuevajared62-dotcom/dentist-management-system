import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Dentist from '@/models/Dentist';
import { DentistSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse } from '@/lib/api-helpers';

// PUT /api/dentists/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = DentistSchema.partial().safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const dentist = await Dentist.findByIdAndUpdate(params.id, parsed.data, { new: true })
    .populate('userId', 'name email')
    .populate('branchId', 'name city');
  if (!dentist) return errorResponse('Dentist not found', 404);
  return successResponse(dentist);
}

// DELETE /api/dentists/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();
  await Dentist.findByIdAndUpdate(params.id, { isActive: false });
  return successResponse({ message: 'Dentist deactivated' });
}
