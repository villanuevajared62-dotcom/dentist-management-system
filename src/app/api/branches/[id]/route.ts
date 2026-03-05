import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Branch from '@/models/Branch';
import { BranchSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse } from '@/lib/api-helpers';

// PUT /api/branches/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = BranchSchema.partial().safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const branch = await Branch.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!branch) return errorResponse('Branch not found', 404);
  return successResponse(branch);
}

// DELETE /api/branches/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();
  const branch = await Branch.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
  if (!branch) return errorResponse('Branch not found', 404);
  return successResponse({ message: 'Branch deactivated' });
}
