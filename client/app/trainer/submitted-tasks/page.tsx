"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


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
  image_urls?: string[];
  additional_links?: { title: string; url: string }[];
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

  // Review Modal State
  const [activeReview, setActiveReview] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const handleOpenReview = (sub: Submission) => {
    setActiveReview(sub);
    setGradeScore(sub.score ? String(sub.score) : "");
    setGradeFeedback(sub.feedback || "");
  };

  const closeReview = () => {
    setActiveReview(null);
    setGradeScore("");
    setGradeFeedback("");
  };

  const submitGrade = async () => {
    if (!activeReview) return;
    const scoreNum = Number(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Please enter a valid score (0-100).");
      return;
    }
    setIsGrading(true);
    try {
      const res = await apiClient(`/api/tasks/assignments/${activeReview.assignment_id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scoreNum,
          feedback: gradeFeedback,
          grade: scoreNum >= 80 ? "A" : scoreNum >= 70 ? "B" : scoreNum >= 60 ? "C" : "F",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to submit grade.");
      } else {
        toast.success("✅ Evaluation saved successfully!");
        closeReview();
        fetchSubmissions();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsGrading(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/tasks/submitted`);
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
                <button
                  onClick={() => handleOpenReview(sub)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F6B32B]/10 hover:bg-[#F6B32B]/20 text-[#F6B32B] rounded-lg text-xs font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">rate_review</span>
                  {sub.status === "marked" ? "Re-review" : "Review"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Review Modal Overlay */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0a1426] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Review Submission: {activeReview.task_name}
                </h3>
                <p className="text-xs text-white/40">
                  Student: {activeReview.first_name} {activeReview.last_name}
                </p>
              </div>
              <button 
                onClick={closeReview}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              
              {/* Submission Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-widest text-[#F6B32B]">Student Notes</h4>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-sm text-white/80 whitespace-pre-wrap">
                  {activeReview.submission_desc || "No description provided."}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-widest text-[#F6B32B]">Project Links</h4>
                <div className="flex flex-wrap gap-3">
                  {activeReview.github_url && (
                    <a href={activeReview.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">code</span>
                      GitHub Repo
                    </a>
                  )}
                  {activeReview.live_url && (
                    <a href={activeReview.live_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F6B32B]/10 border border-[#F6B32B]/20 hover:bg-[#F6B32B]/20 text-[#F6B32B] text-sm transition-all">
                      <span className="material-symbols-outlined text-[18px]">public</span>
                      Live Preview
                    </a>
                  )}
                  {activeReview.additional_links?.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">link</span>
                      {link.title}
                    </a>
                  ))}
                  {(!activeReview.github_url && !activeReview.live_url && (!activeReview.additional_links || activeReview.additional_links.length === 0)) && (
                    <span className="text-white/40 text-sm">No links provided.</span>
                  )}
                </div>
              </div>

              {/* Screenshots */}
              {activeReview.image_urls && activeReview.image_urls.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-widest text-[#F6B32B]">Screenshots</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activeReview.image_urls.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="block aspect-video rounded-xl border border-white/10 overflow-hidden hover:border-[#F6B32B]/50 transition-all">
                        <img src={img} alt="Screenshot" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-white/5" />

              {/* Grading Form */}
              <div className="space-y-6">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-widest text-emerald-400">Evaluation & Grading</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Score */}
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Score (0-100)<span className="text-red-400 ml-0.5">*</span></label>
                    <input 
                      type="number"
                      min="0" max="100"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      placeholder="e.g. 95"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-[#F6B32B]/50 focus:outline-none transition-all text-xl font-bold"
                    />
                  </div>
                  
                  {/* Feedback */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Feedback Notes</label>
                    <textarea 
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Great job on the UI. The responsive design looks solid..."
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-[#F6B32B]/50 focus:outline-none transition-all text-sm resize-none custom-scrollbar"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 shrink-0 flex justify-end gap-3 bg-white/[0.01]">
              <button 
                onClick={closeReview}
                disabled={isGrading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitGrade}
                disabled={isGrading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F6B32B] hover:bg-[#F6B32B]/90 text-black shadow-[0_0_15px_rgba(246,179,43,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGrading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">publish</span> Save Evaluation</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
