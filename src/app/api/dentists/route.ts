import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Dentist from '@/models/Dentist';
import { DentistSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse } from '@/lib/api-helpers';

// Cache headers for GET requests
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
};

// GET /api/dentists — optional ?branchId= filter
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const branchId = req.nextUrl.searchParams.get('branchId');
  const filter: Record<string, unknown> = { isActive: true };
  if (branchId) filter.branchId = branchId;

  await connectDB();
  
  // Get dentists with profiles
  const dentistsWithProfile = await Dentist.find(filter)
    .populate('userId', 'name email')
    .populate('branchId', 'name city')
    .sort({ createdAt: -1 });

  // If no branch filter, also get users with dentist role who don't have a profile yet
  if (!branchId) {
    const usersWithoutProfile = await User.find({ 
      role: 'dentist', 
      isActive: true 
    }).populate('branchId', 'name city');
    
    // Combine and filter out duplicates
    const combined: any[] = [...dentistsWithProfile];
    for (const user of usersWithoutProfile) {
      const hasProfile = dentistsWithProfile.some((d: any) => 
        d.userId && d.userId._id.toString() === user._id.toString()
      );
      if (!hasProfile) {
        combined.push({
          _id: user._id,
          userId: { _id: user._id, name: user.name, email: user.email },
          branchId: user.branchId,
          specialty: 'General Dentistry',
          licenseNumber: 'N/A',
          schedule: [],
          isActive: true,
          isPending: true // Flag to indicate this user needs a profile
        } as any);
      }
    }
    
    return NextResponse.json(successResponse(combined), { headers: CACHE_HEADERS });
  }

  return NextResponse.json(successResponse(dentistsWithProfile), { headers: CACHE_HEADERS });
}

// POST /api/dentists — admin only
export async function POST(req: NextRequest) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = DentistSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

  await connectDB();

  const existing = await Dentist.findOne({ userId: parsed.data.userId });
  if (existing) return errorResponse('This user already has a dentist profile', 409);

  const dentist = await Dentist.create(parsed.data);
  const populated = await dentist.populate([
    { path: 'userId', select: 'name email' },
    { path: 'branchId', select: 'name city' },
  ]);
  return successResponse(populated, 201);
}
