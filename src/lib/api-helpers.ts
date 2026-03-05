import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { UserRole } from '@/types';
import AuditLog from '@/models/AuditLog';
import { connectDB } from '@/lib/db';

// Extended session type with our custom fields
interface SessionWithUser {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
    branchId?: string;
  };
}

/** Get session or return 401 */
export async function requireSession(allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions) as SessionWithUser | null;
  
  if (!session?.user) {
    return { 
      error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
      session: null 
    };
  }
  
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { 
      error: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }),
      session: null 
    };
  }
  
  return { session };
}

/** Standard error response */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/** Standard success response */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Create audit log entry */
export async function createAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL',
  module: 'Appointment' | 'Patient' | 'User' | 'Branch' | 'Dentist',
  performedById: string,
  details: string
) {
  await connectDB();
  await AuditLog.create({
    action,
    module,
    performedBy: performedById,
    details,
  });
}
