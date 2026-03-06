import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { UserCreateSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';

// GET /api/users — admin only, with optional ?role= filter
export async function GET(req: NextRequest) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  const role = req.nextUrl.searchParams.get('role');
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;

  await connectDB();
  const users = await User.find(filter)
    .populate('branchId', 'name')
    .sort({ name: 1 });
  return successResponse(users);
}

// POST /api/users — admin creates accounts
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = UserCreateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) return errorResponse('Email already in use', 409);

  const user = await User.create(parsed.data);
  await createAuditLog(
    'CREATE',
    'User',
    session!.user.id,
    `Created user: ${user.name} (${user.email})`
  );
  return successResponse(user, 201);
}
