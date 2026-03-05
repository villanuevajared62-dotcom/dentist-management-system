import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import { requireSession, successResponse } from '@/lib/api-helpers';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for admin view:
 * - Appointments per day for current week
 * - Appointment status breakdown
 * - Appointments per branch
 */
export async function GET(req: NextRequest) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();

  const today = new Date();
  
  // Get start and end of current week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
  
  // Generate all days of the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Appointments per day this week
  const weeklyAppointments = await Promise.all(
    weekDays.map(async (day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = await Appointment.countDocuments({ date: dateStr });
      return {
        day: format(day, 'EEE'), // Mon, Tue, etc.
        date: dateStr,
        count,
      };
    })
  );

  // Appointment status breakdown (all time)
  const statusBreakdown = await Appointment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusMap = statusBreakdown.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: 'Pending', value: statusMap['Pending'] ?? 0, color: '#f59e0b' },
    { name: 'Completed', value: statusMap['Completed'] ?? 0, color: '#10b981' },
    { name: 'Missed', value: statusMap['Missed'] ?? 0, color: '#ef4444' },
    { name: 'Cancelled', value: statusMap['Cancelled'] ?? 0, color: '#6b7280' },
  ];

  // Appointments per branch
  const branchAppointments = await Appointment.aggregate([
    {
      $group: {
        _id: '$branchId',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branch',
      },
    },
    {
      $unwind: '$branch',
    },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branch.name',
        count: 1,
        _id: 0,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return successResponse({
    weeklyAppointments,
    statusBreakdown: statusData,
    branchAppointments,
  });
}

