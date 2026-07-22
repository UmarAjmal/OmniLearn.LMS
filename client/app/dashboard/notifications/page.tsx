"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

interface NotificationAnalytics {
  id: number;
  type: string;
  title: string;
  priority: string;
  created_at: string;
  total_recipients: string;
  read_count: string;
  unread_count: string;
  read_percentage: string;
}

export default function NotificationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient("/api/notifications/analytics");
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data || []);
      } else {
        toast.error(json.error || "Failed to load analytics");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pt-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F6B32B] text-4xl">analytics</span>
            Notification Analytics
          </h1>
          <p className="text-white/50 mt-1 text-sm">Monitor acknowledgement rates for dispatched notifications</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 transition-colors text-sm font-medium w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Data
        </button>
      </div>

      <div className="bg-[#101827] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="text-xs text-white uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4 text-center">Recipients</th>
                <th className="px-6 py-4 text-center">Read</th>
                <th className="px-6 py-4 text-center">Unread</th>
                <th className="px-6 py-4">Ack. Rate</th>
                <th className="px-6 py-4">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-white/30">Loading analytics...</td>
                </tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-white/30">No notifications dispatched yet.</td>
                </tr>
              ) : (
                analytics.map((item) => (
                  <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={item.title}>
                      {item.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 border border-white/10 text-[10px] px-2 py-1 rounded-md uppercase tracking-wider">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.priority === 'critical' ? (
                        <span className="text-red-400 font-bold text-xs uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Critical
                        </span>
                      ) : (
                        <span className="text-white/50 text-xs uppercase">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono">{item.total_recipients}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-mono">{item.read_count}</td>
                    <td className="px-6 py-4 text-center text-[#F6B32B] font-mono">{item.unread_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-white/10 rounded-full h-1.5 max-w-[60px]">
                          <div 
                            className="bg-[#F6B32B] h-1.5 rounded-full" 
                            style={{ width: `${item.read_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono">{item.read_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
