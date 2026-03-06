import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Branch from '@/models/Branch';
import { BranchSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';
import { sanitizeInput, sanitizeName } from '@/lib/utils';

// PUT /api/branches/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = BranchSchema.partial().safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const sanitizedData = { ...parsed.data };
  if (sanitizedData.name) sanitizedData.name = sanitizeName(sanitizedData.name);
  if (sanitizedData.address) sanitizedData.address = sanitizeInput(sanitizedData.address);

  const branch = await Branch.findByIdAndUpdate(params.id, sanitizedData, { new: true });
  if (!branch) return errorResponse('Branch not found', 404);

  await createAuditLog(
    'UPDATE',
    'Branch',
    session!.user.id,
    `Updated branch: ${branch.name}`
  );

  return successResponse(branch);
}

// DELETE /api/branches/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();
  const branch = await Branch.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
  if (!branch) return errorResponse('Branch not found', 404);

  await createAuditLog(
    'DELETE',
    'Branch',
    session!.user.id,
    `Deactivated branch: ${branch.name}`
  );

  return successResponse({ message: 'Branch deactivated' });
}
