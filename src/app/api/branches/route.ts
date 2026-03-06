import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Branch from '@/models/Branch';
import { BranchSchema } from '@/lib/validations';
import { requireSession, successResponse, errorResponse, createAuditLog } from '@/lib/api-helpers';
import { sanitizeInput, sanitizeName } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/branches — any authenticated user
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  await connectDB();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
  return successResponse(branches);
}

// POST /api/branches — admin only
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const parsed = BranchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message);
  }

  // Sanitize input fields to prevent XSS and injection attacks
  const sanitizedData = {
    ...parsed.data,
    name: sanitizeName(parsed.data.name),
    address: sanitizeInput(parsed.data.address),
  };

  await connectDB();
  const branch = await Branch.create(sanitizedData);
  await createAuditLog(
    'CREATE',
    'Branch',
    session!.user.id,
    `Created branch: ${branch.name}`
  );
  return successResponse(branch, 201);
}
