"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

interface Submission {
  assignment_id: number;
  task_name: string;
  course_label: string;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  email: string;
  avatar_url: string | null;
  status: "completed" | "marked";
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  submitted_at: string | null;
  github_url: string | null;
  live_url: string | null;
  submission_desc: string | null;
  submission_notes: string | null;
  due_date: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-orange-500/15 text-orange-400",
  marked: "bg-emerald-500/15 text-emerald-400",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Pending Review",
  marked: "Reviewed",
};

export default function SubmittedTasksPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filtered, setFiltered] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "marked">("all");

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/submitted`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data || []);
        setFiltered(json.data || []);
      }
    } catch {
      toast.error("Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchSubmissions();
  }, [fetchSubmissions, router]);

  useEffect(() => {
    let data = [...submissions];
    if (statusFilter !== "all") data = data.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.task_name.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [search, statusFilter, submissions]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Submitted Tasks</h1>
        <p className="text-white/40 text-sm">Review student submissions and provide feedback</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/30 text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or task…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "completed", "marked"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all ${
                statusFilter === s
                  ? "bg-[#F6B32B] text-black"
                  : "bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.08]"
              }`}
            >
              {s === "all" ? "All" : s === "completed" ? "Pending" : "Reviewed"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", count: submissions.length, color: "text-white" },
          { label: "Pending Review", count: submissions.filter(s => s.status === "completed").length, color: "text-orange-400" },
          { label: "Reviewed", count: submissions.filter(s => s.status === "marked").length, color: "text-emerald-400" },
        ].map((item) => (
          <div key={item.label} className="bg-[#101827] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-[11px] text-white/40 uppercase tracking-wide mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">inbox</span>
          <p className="text-white/40 text-sm">No submissions found</p>
        </div>
      ) : (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
            <span>Student</span>
            <span>Task</span>
            <span>Course</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((sub) => (
              <div key={sub.assignment_id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                {/* Student */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 border border-white/[0.06] overflow-hidden">
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-white/50 font-bold text-sm">{(sub.first_name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sub.first_name} {sub.last_name}</p>
                    <p className="text-[11px] text-white/30 truncate">{sub.enrollment_id || sub.email}</p>
                  </div>
                </div>
                {/* Task */}
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{sub.task_name}</p>
                  {sub.github_url && (
                    <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">link</span>
                      GitHub
                    </a>
                  )}
                </div>
                {/* Course */}
                <span className="text-xs text-white/40">{sub.course_label || "—"}</span>
                {/* Submitted */}
                <span className="text-xs text-white/40">
                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "—"}
                </span>
                {/* Status */}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${STATUS_STYLES[sub.status] || "bg-white/5 text-white/40"}`}>
                  {STATUS_LABELS[sub.status] || sub.status}
                </span>
                {/* Action */}
                <Link
                  href={`/tasks/review/${sub.assignment_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F6B32B]/10 hover:bg-[#F6B32B]/20 text-[#F6B32B] rounded-lg text-xs font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">rate_review</span>
                  {sub.status === "marked" ? "Re-review" : "Review"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
