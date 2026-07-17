"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  role: string;
  created_at: string;
}

export default function StudentAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/announcements`);
      const json = await res.json();
      if (json.success) setAnnouncements(json.data || []);
    } catch { toast.error("Failed to load announcements."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("lms_auth");
    if (!auth) { router.push("/"); return; }
    fetchAnnouncements();
  }, [fetchAnnouncements, router]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Announcements</h1>
        <p className="text-white/40 text-sm">Latest updates from your trainers and admin</p>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">campaign</span>
          <p className="text-white/40 text-sm">No announcements yet</p>
          <p className="text-white/25 text-xs mt-1">Check back later for updates from your trainers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann, idx) => (
            <div
              key={ann.id}
              className={`bg-[#101827] border rounded-2xl p-6 transition-all ${
                idx === 0 ? "border-[#F6B32B]/20 shadow-[0_0_20px_rgba(246,179,43,0.05)]" : "border-white/[0.06] hover:border-white/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ann.role === "admin" ? "bg-[#F6B32B]/10" : "bg-blue-500/10"}`}>
                  <span
                    className={`material-symbols-outlined text-[20px] ${ann.role === "admin" ? "text-[#F6B32B]" : "text-blue-400"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {ann.role === "admin" ? "admin_panel_settings" : "school"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {idx === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6B32B] text-black uppercase tracking-wide">Latest</span>
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ann.role === "admin" ? "bg-[#F6B32B]/15 text-[#F6B32B]" : "bg-blue-500/15 text-blue-400"}`}>
                      {ann.role === "admin" ? "Admin" : "Trainer"}
                    </span>
                    <span className="text-[11px] text-white/30">
                      {new Date(ann.created_at).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{ann.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-[11px] text-white/25 mt-3">— {ann.author_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
