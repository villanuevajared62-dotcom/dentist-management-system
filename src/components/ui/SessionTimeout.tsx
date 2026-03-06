'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

const WARNING_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export function SessionTimeout() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      await update();
      setShowWarning(false);
      toast.success('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast.error('Failed to refresh session');
    }
  }, [update]);

  const handleLogout = useCallback(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    if (!session?.expires) return;

    const checkSessionExpiry = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const remaining = expiresAt - now;

      setTimeRemaining(remaining);

      if (remaining > 0 && remaining <= WARNING_TIME && !showWarning) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        handleLogout();
      }
    };

    checkSessionExpiry();

    const intervalId = setInterval(checkSessionExpiry, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [session?.expires, showWarning, handleLogout]);

  if (!session) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Session Expiring Soon
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Your session will expire in {timeRemaining ? formatTime(timeRemaining) : '5 minutes'}. 
                Do you want to stay logged in?
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Logout
              </button>
              <button
                onClick={refreshSession}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

