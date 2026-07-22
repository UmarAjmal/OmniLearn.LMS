"use client";

import { useNotifications } from "@/components/NotificationProvider";
import Link from "next/link";
import { useState } from "react";

export default function NotificationCenter() {
  const { notifications, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.is_read);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen pt-24 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F6B32B] text-4xl">notifications</span>
            Notification Center
          </h1>
          <p className="text-white/50 mt-1 text-sm">Stay updated with your latest alerts and tasks</p>
        </div>
        
        <div className="flex bg-[#1E2A3B] p-1 rounded-xl border border-white/5 w-fit">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#F6B32B] text-black shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'unread' ? 'bg-[#F6B32B] text-black shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-[#101827] border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <span className="material-symbols-outlined text-white/10 text-6xl mb-4">notifications_off</span>
            <h3 className="text-xl font-bold text-white/50">You're all caught up!</h3>
            <p className="text-white/30 text-sm mt-2">No {filter === 'unread' ? 'unread ' : ''}notifications at the moment.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`group bg-[#101827] border ${!n.is_read ? 'border-[#F6B32B]/30 shadow-[0_0_15px_rgba(246,179,43,0.1)]' : 'border-white/10'} rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col sm:flex-row gap-4 sm:items-center relative overflow-hidden`}
            >
              {!n.is_read && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#F6B32B]"></div>
              )}
              
              <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-white/5 ${!n.is_read ? 'text-[#F6B32B]' : 'text-white/40'}`}>
                <span className="material-symbols-outlined text-2xl">
                  {n.type === 'announcement' ? 'campaign' : 
                   n.type === 'assignment' ? 'assignment' : 
                   n.type === 'lead_campaign' ? 'rocket_launch' : 'notifications'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold truncate ${!n.is_read ? 'text-white' : 'text-white/70'}`}>
                        {n.title}
                      </h3>
                      {n.priority === 'critical' && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 line-clamp-2">{n.message}</p>
                  </div>
                  <span className="text-[11px] text-white/30 whitespace-nowrap hidden sm:block">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {n.action_url && (
                    <Link href={n.action_url} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
                      View Details
                    </Link>
                  )}
                  {n.attachment_url && (
                    <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#F6B32B] hover:text-[#E09B18] text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">attach_file</span>
                      Attachment
                    </a>
                  )}
                </div>
              </div>
              
              {!n.is_read && (
                <button 
                  onClick={() => markAsRead(n.id)}
                  className="sm:opacity-0 group-hover:opacity-100 absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto bg-[#F6B32B]/10 hover:bg-[#F6B32B]/20 text-[#F6B32B] w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  title="Mark as read"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
