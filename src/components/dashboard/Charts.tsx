'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertCircle } from 'lucide-react';

interface ChartData {
  weeklyAppointments: { day: string; count: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  branchAppointments: { branchName: string; count: number }[];
}

interface ApiError {
  message?: string;
}

async function fetchStats(): Promise<ChartData> {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ message: 'Failed to fetch stats' }));
    throw new Error(error.message || 'Failed to fetch stats');
  }
  const data = await res.json();
  return data.data;
}

export default function DashboardCharts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loading skeleton for weekly chart */}
        <div className="card">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
        </div>
        {/* Loading skeleton for status chart */}
        <div className="card">
          <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
        </div>
        {/* Loading skeleton for branch chart */}
        <div className="card lg:col-span-2">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4"></div>
          <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <div className="flex flex-col items-center justify-center text-slate-500">
          <AlertCircle className="w-10 h-10 mb-3 text-amber-500" />
          <p className="font-medium">Unable to load chart data</p>
          <p className="text-sm mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Handle empty or invalid data
  if (!data || !data.weeklyAppointments) {
    return (
      <div className="card p-8 text-center text-slate-500">
        <p>No chart data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Appointments Bar Chart */}
      <div className="card">
        <h3 className="section-title mb-4">This Week&apos;s Appointments</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeklyAppointments} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown Pie Chart */}
      <div className="card">
        <h3 className="section-title mb-4">Appointment Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.statusBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Appointments per Branch Bar Chart */}
      <div className="card lg:col-span-2">
        <h3 className="section-title mb-4">Appointments by Branch</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.branchAppointments} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="branchName" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

