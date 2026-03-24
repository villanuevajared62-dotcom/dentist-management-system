import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import Branch from '@/models/Branch';
import Dentist from '@/models/Dentist';
import { format } from 'date-fns';
import { Calendar, Users, Building2, Stethoscope, Clock } from 'lucide-react';
import Link from 'next/link';
import { STATUS_COLORS, formatTime } from '@/lib/utils';
import { AppointmentStatus } from '@/types';
import DashboardCharts from '@/components/dashboard/Charts';
import { redirect } from 'next/navigation';

async function getDashboardData(role: string, userId: string) {
  await connectDB();
  const today = format(new Date(), 'yyyy-MM-dd');

  if (role === 'admin') {
    const [totalAppts, todayAppts, patients, branches, dentists] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today }),
      Patient.countDocuments({ isActive: true }),
      Branch.countDocuments({ isActive: true }),
      Dentist.countDocuments({ isActive: true }),
    ]);
    const recentAppts = await Appointment.find({ date: today })
      .populate('patientId', 'firstName lastName')
      .populate({ path: 'dentistId', populate: { path: 'userId', select: 'name' } })
      .populate('branchId', 'name')
      .sort({ startTime: 1 })
      .limit(5)
      .lean();
    return { totalAppts, todayAppts, patients, branches, dentists, recentAppts };
  }

  if (role === 'staff') {
    const [todayAppts, patients] = await Promise.all([
      Appointment.countDocuments({ date: today }),
      Patient.countDocuments({ isActive: true }),
    ]);
    const recentAppts = await Appointment.find({ date: today })
      .populate('patientId', 'firstName lastName')
      .populate({ path: 'dentistId', populate: { path: 'userId', select: 'name' } })
      .populate('branchId', 'name')
      .sort({ startTime: 1 })
      .limit(10)
      .lean();
    return { todayAppts, patients, recentAppts };
  }

  // dentist
  const dentist = await Dentist.findOne({ userId });
  const recentAppts = dentist
    ? await Appointment.find({ dentistId: dentist._id, date: today })
        .populate('patientId', 'firstName lastName phone')
        .sort({ startTime: 1 })
        .lean()
    : [];
  return { todayAppts: recentAppts.length, recentAppts };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role ?? 'staff';
  const data = await getDashboardData(role, session.user.id);
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  const firstName = (session.user.name || session.user.email || 'there').split(' ')[0];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Welcome back, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Appointments" value={data.todayAppts ?? 0} icon={Calendar} color="brand" />
        {'patients' in data && <StatCard label="Total Patients" value={data.patients ?? 0} icon={Users} color="emerald" />}
        {'branches' in data && <StatCard label="Active Branches" value={data.branches ?? 0} icon={Building2} color="violet" />}
        {'dentists' in data && <StatCard label="Dentists" value={data.dentists ?? 0} icon={Stethoscope} color="amber" />}
        {'totalAppts' in data && <StatCard label="Total Appointments" value={data.totalAppts ?? 0} icon={Clock} color="sky" />}
      </div>

      {/* Charts - Admin only */}
      {role === 'admin' && <DashboardCharts />}

      {/* Today's Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Today&apos;s Appointments</h2>
          <Link href="/dashboard/appointments" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>

        {data.recentAppts?.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Calendar className="mx-auto mb-2 opacity-40" size={40} />
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Time</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Patient</th>
                  {role !== 'dentist' && <th className="text-left py-2 px-3 text-slate-500 font-medium">Dentist</th>}
                  {role === 'admin' && <th className="text-left py-2 px-3 text-slate-500 font-medium">Branch</th>}
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.recentAppts.map((appt: any) => (
                  <tr key={appt._id.toString()} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-xs">
                      {formatTime(appt.startTime)}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {appt.patientId?.firstName} {appt.patientId?.lastName}
                    </td>
                    {role !== 'dentist' && (
                      <td className="py-2.5 px-3 text-slate-600">
                        Dr. {appt.dentistId?.userId?.name}
                      </td>
                    )}
                    {role === 'admin' && (
                      <td className="py-2.5 px-3 text-slate-500">{appt.branchId?.name}</td>
                    )}
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colors: Record<string, string> = {
    brand:   'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
    amber:   'bg-amber-50 text-amber-600',
    sky:     'bg-sky-50 text-sky-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}


