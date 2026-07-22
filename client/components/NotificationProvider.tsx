"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { getFCMToken, onMessageListener } from "@/lib/firebase";
import { toast } from "react-toastify";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  action_url: string;
  attachment_url: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  refreshNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [blockingNotification, setBlockingNotification] = useState<Notification | null>(null);
  const pathname = usePathname();

  // Load notifications
  const fetchNotifications = async () => {
    try {
      const res = await apiClient("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    // Only run if user is in dashboard or student panel
    if (pathname.includes('/dashboard') || pathname.includes('/student') || pathname.includes('/trainer')) {
      fetchNotifications();
      registerFCMToken();
    }
  }, [pathname]);

  useEffect(() => {
    // Find the first unread critical notification to show as blocking popup
    const critical = notifications.find(n => n.priority === 'critical' && !n.is_read);
    if (critical) {
      setBlockingNotification(critical);
    } else {
      setBlockingNotification(null);
    }
  }, [notifications]);

  // Listen for foreground messages
  useEffect(() => {
    const listenToMessages = async () => {
      try {
        const payload: any = await onMessageListener();
        if (payload && payload.notification) {
          toast.info(payload.notification.title);
          fetchNotifications(); // Refresh list to get new notification
        }
      } catch (err) {
        console.log("Foreground message listener failed:", err);
      }
    };
    listenToMessages();
  }, []);

  const registerFCMToken = async () => {
    try {
      const token = await getFCMToken();
      if (token) {
        await apiClient("/api/notifications/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, device_type: 'web' })
        });
      }
    } catch (err) {
      console.error("FCM Token registration failed", err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient(`/api/notifications/${id}/read`, { method: 'POST' });
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      
      // If it was the blocking one, it will disappear due to useEffect above
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refreshNotifications: fetchNotifications }}>
      {children}
      
      {/* Mandatory Blocking Popup */}
      {blockingNotification && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#101827] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-gradient-to-r from-red-500/10 to-transparent">
              <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Critical Alert</h2>
                <p className="text-sm text-red-400">Please acknowledge to continue</p>
              </div>
            </div>
            
            <div className="p-8 space-y-4">
              <h3 className="text-2xl font-bold text-white">{blockingNotification.title}</h3>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{blockingNotification.message}</p>
              
              <div className="pt-4 flex gap-4">
                {blockingNotification.action_url && (
                  <Link href={blockingNotification.action_url} className="text-blue-400 hover:text-blue-300 underline font-medium">
                    View Details
                  </Link>
                )}
                {blockingNotification.attachment_url && (
                  <a href={blockingNotification.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#F6B32B] hover:text-[#E09B18] font-medium">
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    Download Attachment
                  </a>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-end">
              <button 
                onClick={() => markAsRead(blockingNotification.id)}
                className="bg-[#F6B32B] hover:bg-[#E09B18] text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#F6B32B]/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">done_all</span>
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
