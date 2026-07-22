"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useNotifications } from "./NotificationProvider";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('lms_user_role'));
  }, []);

  const href = role === 'admin' || role === 'trainer' ? '/dashboard/notifications' : '/student/notifications';

  return (
    <Link href={href} className="relative p-2 text-white/50 hover:text-white transition-colors group">
      <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
        notifications
      </span>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
