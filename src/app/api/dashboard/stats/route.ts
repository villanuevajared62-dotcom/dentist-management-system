import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import { requireSession, successResponse } from '@/lib/api-helpers';
import { format, startOfWeek, endOfWeek } from 'date-fns';

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for admin view:
 * - Appointments per day for current week
 * - Appointment status breakdown
 * - Appointments per branch
 * 
 * OPTIMIZED: Uses single aggregation query instead of multiple separate calls
 */
export async function GET(req: NextRequest) {
  const { error } = await requireSession(['admin']);
  if (error) return error;

  await connectDB();

  const today = new Date();
  
  // Get start and end of current week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
  
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // OPTIMIZATION: Single aggregation query for weekly appointments
  // Instead of 7 separate countDocuments calls
  const weeklyAggregation = await Appointment.aggregate([
    {
      $match: {
        date: { $gte: weekStartStr, $lte: weekEndStr }
      }
    },
    {
      $group: {
        _id: '$date',
        count: { $sum: 1 }
      }
    }
  ]);

  // Create a map for quick lookup
  const weeklyCountMap = weeklyAggregation.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as Record<string, number>);

  // Generate all days of the week with their counts
  const weekDays: { day: string; date: string; count: number }[] = [];
  const current = new Date(weekStart);
  while (current <= weekEnd) {
    const dateStr = format(current, 'yyyy-MM-dd');
    weekDays.push({
      day: format(current, 'EEE'), // Mon, Tue, etc.
      date: dateStr,
      count: weeklyCountMap[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

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
      $unwind: {
        path: '$branch',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        branchId: '$_id',
        branchName: { $ifNull: ['$branch.name', 'Unknown'] },
        count: 1,
        _id: 0,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return successResponse({
    weeklyAppointments: weekDays,
    statusBreakdown: statusData,
    branchAppointments,
  });
}

