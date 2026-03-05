import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import Dentist from '@/models/Dentist';
import { requireSession, successResponse, errorResponse } from '@/lib/api-helpers';
import { generateTimeSlots, addMinutes } from '@/lib/utils';

/**
 * Helper function to convert time string to minutes since midnight
 * @param time - Time in "HH:MM" format
 * @returns minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * GET /api/appointments/slots?dentistId=...&date=YYYY-MM-DD&duration=30|60|90|120
 * Returns available time slots for a dentist on a given date, considering appointment duration.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const dentistId = req.nextUrl.searchParams.get('dentistId');
  const date = req.nextUrl.searchParams.get('date');
  const duration = parseInt(req.nextUrl.searchParams.get('duration') || '30');

  if (!dentistId || !date) {
    return errorResponse('dentistId and date are required');
  }

  await connectDB();

  // Fetch dentist schedule to know working hours for the day
  const dentist = await Dentist.findById(dentistId);
  if (!dentist) return errorResponse('Dentist not found', 404);

  // Check if dentist is active
  if (!dentist.isActive) {
    return successResponse({ slots: [], message: 'Dentist is not available' });
  }

  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const daySchedule = dentist.schedule.find(s => s.dayOfWeek === dayOfWeek);

  if (!daySchedule) {
    return successResponse({ slots: [], message: 'Dentist does not work on this day' });
  }

  // Generate all 30-min slots for the working day
  const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);

  // Fetch booked appointments for this dentist on this date
  const booked = await Appointment.find({
    dentistId,
    date,
    status: { $in: ['Pending', 'Completed'] },
  }).select('startTime endTime');

  // Convert booked appointments to minutes for proper comparison
  const bookedMinutes = booked.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime)
  }));

  // Filter out slots that cannot accommodate the requested duration
  // A slot is unavailable if any part of the appointment would extend beyond working hours
  // or overlap with an existing appointment
  const workStartMinutes = timeToMinutes(daySchedule.startTime);
  const workEndMinutes = timeToMinutes(daySchedule.endTime);

  const available = allSlots.filter(slot => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration;
    
    // Check if appointment would end after working hours
    if (slotEnd > workEndMinutes) {
      return false;
    }
    
    // Check for overlaps with existing appointments using minute-based comparison
    // An overlap occurs if:
    // - New appointment starts during an existing one
    // - New appointment ends during an existing one  
    // - New appointment fully contains an existing one
    const hasOverlap = bookedMinutes.some(b => {
      return (
        (slotStart >= b.start && slotStart < b.end) ||
        (slotEnd > b.start && slotEnd <= b.end) ||
        (slotStart <= b.start && slotEnd >= b.end)
      );
    });
    
    return !hasOverlap;
  });

  return successResponse({ slots: available, workStart: daySchedule.startTime, workEnd: daySchedule.endTime });
}
