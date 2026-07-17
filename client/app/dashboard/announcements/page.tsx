"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Uses relative /api/* paths → Next.js route handlers proxy to Express backend

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  role: string;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/announcements`);
      const json = await res.json();
      if (json.success) setAnnouncements(json.data || []);
      else toast.error(json.error || "Failed to load announcements.");
    } catch (err) {
      console.error("fetchAnnouncements error:", err);
      toast.error("Failed to load announcements.");
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchAnnouncements();
  }, [fetchAnnouncements, router]);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required."); return; }
    setIsPosting(true);
    try {
      const uid = localStorage.getItem("lms_user_id");
      const res = await fetch(`/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorId: uid, authorName: "Admin", role: "admin", target: "all", sendEmail }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Announcement published!");
        setTitle(""); setContent(""); setSendEmail(false); setShowForm(false);
        fetchAnnouncements();
      } else toast.error(json.error || "Failed to publish.");
    } catch (err) {
      console.error("handlePost error:", err);
      toast.error("Network error.");
    }
    finally { setIsPosting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      toast.success("Deleted."); fetchAnnouncements();
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error("Failed to delete.");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Announcements</h1>
          <p className="text-white/40 text-sm">Broadcast updates to all students and trainers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 text-sm">
          <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#101827] border border-[#F6B32B]/20 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-white mb-4">Compose</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Content</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Write your message…" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40 resize-none" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="w-4 h-4 accent-[#F6B32B]" />
              <span className="text-sm text-white/60">Also send email to all students</span>
            </label>
            <button onClick={handlePost} disabled={isPosting} className="px-6 py-2.5 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
              {isPosting ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <span className="material-symbols-outlined text-[18px]">campaign</span>}
              {isPosting ? "Publishing…" : "Publish Now"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">campaign</span>
          <p className="text-white/40 text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ann.role === "admin" ? "bg-[#F6B32B]/15 text-[#F6B32B]" : "bg-blue-500/15 text-blue-400"}`}>{ann.role}</span>
                    <span className="text-[11px] text-white/30">{new Date(ann.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{ann.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-[11px] text-white/25 mt-3">— {ann.author_name}</p>
                </div>
                <button onClick={() => handleDelete(ann.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
