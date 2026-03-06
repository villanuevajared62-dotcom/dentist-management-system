import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { requireSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/audit-log — admin only
export async function GET(req: NextRequest) {
  const { session, error } = await requireSession(['admin']);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action');
  const module = searchParams.get('module');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const query: Record<string, unknown> = {};

  if (action) query.action = action;
  if (module) query.module = module;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) (query.createdAt as Record<string, string>).$gte = dateFrom;
    if (dateTo) (query.createdAt as Record<string, string>).$lte = dateTo;
  }

  await connectDB();
  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role branchId')
    .populate({ path: 'performedBy', populate: { path: 'branchId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(200);

  return successResponse(logs);
}

// DELETE /api/audit-log â€” admin only (bulk delete)
export async function DELETE(req: NextRequest) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  const body = await req.json();
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return errorResponse('No audit log IDs provided', 400);

  await connectDB();
  const result = await AuditLog.deleteMany({ _id: { $in: ids } });

  return successResponse({ deleted: result.deletedCount });
}

