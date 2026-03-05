import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppointmentStatus } from '@/types';
import sanitizeHtml from 'sanitize-html';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sanitize a string input to prevent XSS and injection attacks */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  
  // Strip HTML tags
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  
  // Trim whitespace
  return stripped.trim();
}

/** Sanitize name fields (removes special characters) */
export function sanitizeName(input: string | undefined | null): string {
  if (!input) return '';
  
  // First strip HTML, then remove special characters
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  
  // Remove special characters except spaces, hyphens, and apostrophes
  const cleaned = stripped.replace(/[^a-zA-Z0-9\s\-']/g, '');
  
  return cleaned.trim();
}

/** Generate 30-minute time slots between two times */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes = 30
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + intervalMinutes <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += intervalMinutes;
  }

  return slots;
}

/** Add minutes to a time string → "HH:MM" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

/** Status colour mapping for badges */
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  Pending:   'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Missed:    'bg-red-100 text-red-800 border-red-200',
  Cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

/** Format a date string to locale display */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** Format time "HH:MM" → "9:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}
