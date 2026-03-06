import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { UserUpdateSchema, PasswordResetSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = UserUpdateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  const user = await User.findByIdAndUpdate(params.id, parsed.data, { new: true });
  if (!user) return errorResponse('User not found', 404);
  await createAuditLog(
    'UPDATE',
    'User',
    session!.user.id,
    `Updated user: ${user.name} (${user.email})`
  );
  return successResponse(user);
}

// PATCH /api/users/[id]/reset-password — admin only
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = PasswordResetSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  
  const user = await User.findByIdAndUpdate(
    params.id, 
    { password: hashedPassword }, 
    { new: true }
  );
  
  if (!user) return errorResponse('User not found', 404);
  await createAuditLog(
    'UPDATE',
    'User',
    session!.user.id,
    `Reset password for user: ${user.name} (${user.email})`
  );
  return successResponse({ message: 'Password reset successfully' });
}

// DELETE /api/users/[id] — soft-deactivate
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return errorResponse('User not found', 404);
  await createAuditLog(
    'DELETE',
    'User',
    session!.user.id,
    `Deleted user: ${user.name} (${user.email})`
  );
  return successResponse({ message: 'User deleted' });
}
