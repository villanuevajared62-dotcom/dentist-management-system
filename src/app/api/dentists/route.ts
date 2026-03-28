import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Dentist from '@/models/Dentist';
import { DentistSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/dentists — optional ?branchId= filter
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const branchId = req.nextUrl.searchParams.get('branchId');
  const filter: Record<string, unknown> = { isActive: true };
  if (branchId) filter.branchId = branchId;

  await connectDB();
  
  // Get dentists with active profiles
  const dentistsWithProfile = await Dentist.find(filter)
    .populate('userId', 'name email')
    .populate('branchId', 'name city')
    .sort({ createdAt: -1 });

  // Only return actual dentist profiles (matches dentists collection)
  return successResponse(dentistsWithProfile);
}

// POST /api/dentists — admin only
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = DentistSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();

  const existing = await Dentist.findOne({ userId: parsed.data.userId });
  if (existing) {
    if (!existing.isActive) {
      const reactivated = await Dentist.findByIdAndUpdate(
        existing._id,
        { ...parsed.data, isActive: true },
        { new: true }
      )
        .populate('userId', 'name email')
        .populate('branchId', 'name city');
      const dentistUserName =
        typeof reactivated.userId === 'object' &&
        reactivated.userId !== null &&
        'name' in reactivated.userId
          ? (reactivated.userId as { name?: string }).name || 'Unknown'
          : 'Unknown';
      await createAuditLog(
        'UPDATE',
        'Dentist',
        session!.user.id,
        `Reactivated dentist profile for ${dentistUserName}`
      );
      return successResponse(reactivated);
    }
    return errorResponse('This user already has a dentist profile', 409);
  }

  const dentist = await Dentist.create(parsed.data);
  const populated = await dentist.populate([
    { path: 'userId', select: 'name email' },
    { path: 'branchId', select: 'name city' },
  ]);
  const dentistUserName =
    typeof populated.userId === 'object' &&
    populated.userId !== null &&
    'name' in populated.userId
      ? (populated.userId as { name?: string }).name || 'Unknown'
      : 'Unknown';
  await createAuditLog(
    'CREATE',
    'Dentist',
    session!.user.id,
    `Created dentist profile for ${dentistUserName}`
  );
  return successResponse(populated, 201);
}
