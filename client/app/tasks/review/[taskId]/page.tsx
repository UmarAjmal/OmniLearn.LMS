"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ScoringHistoryEntry {
  score: number;
  graded_at: string;
  task_name: string;
  status: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  description: string;
  github_url: string;
  live_url: string;
  additional_links: { title: string; url: string }[];
  image_urls: string[];
  video_url: string;
  notes: string;
  submitted_at: string;
}

interface AssignmentDetail {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  graded_at: string | null;
  feedback: string | null;
  assigned_at: string;
  task_name: string;
  task_description: string;
  course_id: string;
  course_label: string;
  points: number;
  due_date: string | null;
  reference_links: { title: string; url: string }[];
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  email: string;
  submission: Submission | null;
  scoring_history: ScoringHistoryEntry[];
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx";

function ToolBtn({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded flex items-center justify-center transition-all ${
        active ? "bg-primary/15 text-primary" : "text-on-surface-variant hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-[17px]">{icon}</span>
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const R = 28;
  const circ = 2 * Math.PI * R;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle cx="36" cy="36" r={R} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="13" fontWeight="800">{score}%</text>
    </svg>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glacier-card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2.5 bg-white/[0.01]">
        <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
        <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TaskReviewPage() {
  const params = useParams();
  const assignmentId = params?.taskId as string;

  const [data, setData]               = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  // Submission form
  const [subDescription, setSubDescription] = useState("");
  const [subGithubUrl,   setSubGithubUrl]   = useState("");
  const [subLiveUrl,     setSubLiveUrl]     = useState("");
  const [subVideoUrl,    setSubVideoUrl]    = useState("");
  const [subNotes,       setSubNotes]       = useState("");
  const [subLinks,       setSubLinks]       = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle,   setNewLinkTitle]   = useState("");
  const [newLinkUrl,     setNewLinkUrl]     = useState("");
  const [subImageUrls,   setSubImageUrls]   = useState<string[]>([]);
  const [newImageUrl,    setNewImageUrl]    = useState("");
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  // Grading
  const [gradeScore,    setGradeScore]    = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading,     setIsGrading]     = useState(false);

  // Editor toggles (visual only — applied as inline style on textarea)
  const [isBold,   setIsBold]   = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode,   setIsCode]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/tasks/assignments/${assignmentId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || "Failed to load assignment details.");
      } else {
        const d: AssignmentDetail = json.data;
        setData(d);
        if (d.submission) {
          setSubDescription(d.submission.description || "");
          setSubGithubUrl(d.submission.github_url || "");
          setSubLiveUrl(d.submission.live_url || "");
          setSubVideoUrl(d.submission.video_url || "");
          setSubNotes(d.submission.notes || "");
          setSubLinks(d.submission.additional_links || []);
          setSubImageUrls(d.submission.image_urls || []);
        }
        if (d.score !== null) setGradeScore(String(d.score));
        if (d.feedback)       setGradeFeedback(d.feedback);
      }
    } catch {
      setFetchError("Network error. Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Link helpers ───────────────────────────────────────────────────────────

  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) { toast.warning("Fill both title and URL."); return; }
    if (!/^https?:\/\//i.test(newLinkUrl)) { toast.warning("URL must start with https://"); return; }
    setSubLinks(prev => [...prev, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }]);
    setNewLinkTitle(""); setNewLinkUrl("");
  };
  const removeLink = (i: number) => setSubLinks(prev => prev.filter((_, idx) => idx !== i));

  const addImageUrl = () => {
    if (!newImageUrl.trim()) { toast.warning("Enter an image URL first."); return; }
    if (!/^https?:\/\//i.test(newImageUrl)) { toast.warning("URL must start with https://"); return; }
    setSubImageUrls(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };
  const removeImage = (i: number) => setSubImageUrls(prev => prev.filter((_, idx) => idx !== i));

  // ── Toolbar text insertions ────────────────────────────────────────────────

  const wrap = (pre: string, suf = pre) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    const nv  = value.slice(0, s) + pre + sel + suf + value.slice(e);
    setSubDescription(nv);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + pre.length, e + pre.length); }, 0);
  };

  const linePrefix = (pfx: string) => {
    setSubDescription(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + pfx);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // ── Submit proof ───────────────────────────────────────────────────────────

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subDescription.trim()) { toast.error("Please write a description."); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: subDescription, githubUrl: subGithubUrl, liveUrl: subLiveUrl,
          videoUrl: subVideoUrl, notes: subNotes, additionalLinks: subLinks, imageUrls: subImageUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Submission failed."); }
      else { toast.success("✅ Task proof submitted!"); fetchData(); }
    } catch { toast.error("Network error during submission."); }
    finally { setIsSubmitting(false); }
  };

  // ── Grade task ─────────────────────────────────────────────────────────────

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = Number(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) { toast.error("Score must be 0–100."); return; }
    setIsGrading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/assignments/${assignmentId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreNum, feedback: gradeFeedback }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Grading failed."); }
      else { toast.success(`🎉 Graded! Score: ${scoreNum}/100`); fetchData(); }
    } catch { toast.error("Network error during grading."); }
    finally { setIsGrading(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full bg-[#080f1e]/60 border border-white/10 rounded-lg p-3 text-white text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors placeholder-white/25";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d1a]">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-xs">Loading assignment…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d1a]">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
          <p className="text-red-400 text-sm font-semibold">{fetchError || "Assignment not found."}</p>
          <button onClick={fetchData}
            className="bg-primary text-black text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  const avgHistory =
    data.scoring_history.length > 0
      ? Math.round(data.scoring_history.reduce((s, h) => s + h.score, 0) / data.scoring_history.length)
      : null;

  const referenceLinks: { title: string; url: string }[] =
    typeof data.reference_links === "string"
      ? JSON.parse(data.reference_links || "[]")
      : data.reference_links || [];

  return (
    <div className="min-h-screen bg-[#060d1a] text-white font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .glacier-card{background:rgba(10,20,38,.75);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08);box-shadow:0 12px 40px rgba(0,0,0,.5);}
        .editor-toolbar{background:rgba(12,22,42,.9);border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:10px 10px 0 0;}
        .editor-body{background:rgba(8,15,30,.6);border:1px solid rgba(255,255,255,.1);border-radius:0 0 10px 10px;}
        body{background:#060d1a;}
      `}} />

      {/* Sticky Nav Bar */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-[#060d1a]/90 backdrop-blur-xl">
        <button type="button" onClick={() => window.close()}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer" title="Close tab">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
        <div className="h-4 w-px bg-white/10" />
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold text-white leading-tight truncate">Task Review &amp; Evaluation</h1>
          <p className="text-[10px] text-on-surface-variant">Assignment #{data.assignment_id} · {data.course_label}</p>
        </div>
        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          {data.status === "marked" && data.score !== null && <ScoreRing score={Number(data.score)} />}
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
            data.status === "marked"    ? "bg-green-500/10 text-green-400 border-green-500/20" :
            data.status === "completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                          "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          }`}>
            {data.status === "marked" ? "Graded" : data.status === "completed" ? "Submitted" : "In Progress"}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className="xl:col-span-4 space-y-5">

          {/* Student Profile */}
          <Section title="Student Profile" icon="person">
            <div className="flex items-center gap-3 mb-4">
              <img src={DEFAULT_AVATAR} alt="student" className="w-12 h-12 rounded-full border-2 border-primary/30 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white truncate">{data.first_name} {data.last_name}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{data.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Enrollment ID", value: data.enrollment_id || "—" },
                { label: "Program",       value: data.course_label  || "—" },
                { label: "Course Dept",   value: data.course_id     || "—" },
                { label: "Assigned On",   value: new Date(data.assigned_at).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-white truncate">{value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Assigned Task */}
          <Section title="Assigned Task" icon="assignment">
            <h4 className="text-sm font-extrabold text-white mb-2">{data.task_name}</h4>
            <p className="text-xs text-on-surface-variant/80 leading-relaxed mb-4">
              {data.task_description || "No description provided."}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.due_date && (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
                  <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                  Due: {new Date(data.due_date).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5">
                <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                {data.points || 100} XP
              </div>
            </div>
            {referenceLinks.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Reference Materials</p>
                {referenceLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-primary/5 rounded-lg transition-all text-xs text-white/80 hover:text-white group">
                    <span className="material-symbols-outlined text-primary text-[14px]">link</span>
                    <span className="flex-1 truncate">{link.title}</span>
                    <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary">open_in_new</span>
                  </a>
                ))}
              </div>
            )}
          </Section>

          {/* Scoring History */}
          <Section title="Scoring History" icon="leaderboard">
            {data.scoring_history.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 font-light text-center py-4">No previous graded tasks found.</p>
            ) : (
              <>
                {avgHistory !== null && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                    <ScoreRing score={avgHistory} />
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Average Score</p>
                      <p className="text-lg font-extrabold text-white">{avgHistory}%</p>
                      <p className="text-[10px] text-on-surface-variant">from {data.scoring_history.length} tasks</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {data.scoring_history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{h.task_name}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {h.graded_at ? new Date(h.graded_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold shrink-0 ${h.score >= 80 ? "text-green-400" : h.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {h.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-8 space-y-5">

          {/* Proof Submission Form */}
          <Section title="Task Completion Proof" icon="rate_review">
            <form onSubmit={handleSubmitProof} className="space-y-5">

              {/* Word-style editor */}
              <div>
                <FieldLabel required>Completion Description &amp; Work Summary</FieldLabel>
                <div className="editor-toolbar flex flex-wrap items-center gap-0.5 px-2 py-1.5">
                  <ToolBtn icon="format_bold"          label="Bold"          active={isBold}   onClick={() => { setIsBold(!isBold);   wrap("**","**"); }} />
                  <ToolBtn icon="format_italic"        label="Italic"        active={isItalic} onClick={() => { setIsItalic(!isItalic); wrap("_","_"); }} />
                  <ToolBtn icon="code"                 label="Inline Code"   active={isCode}   onClick={() => { setIsCode(!isCode);   wrap("`","`"); }} />
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <ToolBtn icon="format_list_bulleted" label="Bullet List"   onClick={() => linePrefix("- ")} />
                  <ToolBtn icon="format_list_numbered" label="Numbered List" onClick={() => linePrefix("1. ")} />
                  <ToolBtn icon="format_quote"         label="Blockquote"    onClick={() => linePrefix("> ")} />
                  <ToolBtn icon="code_blocks"          label="Code Block"    onClick={() => wrap("\n```\n","\n```")} />
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <ToolBtn icon="title"                label="Heading"       onClick={() => linePrefix("## ")} />
                  <ToolBtn icon="horizontal_rule"      label="Divider"       onClick={() => linePrefix("\n---\n")} />
                  <div className="flex-1" />
                  <ToolBtn icon="delete_sweep"         label="Clear content" onClick={() => { if (window.confirm("Clear?")) { setSubDescription(""); toast.info("Cleared."); }}} />
                </div>
                <textarea
                  ref={textareaRef}
                  placeholder="Describe what you built, how you approached the problem, challenges faced, and learnings..."
                  value={subDescription}
                  onChange={e => setSubDescription(e.target.value)}
                  rows={10}
                  style={{ fontWeight: isBold ? "bold" : "normal", fontStyle: isItalic ? "italic" : "normal",
                    fontFamily: isCode ? "'Fira Code',monospace" : "inherit", lineHeight: "1.7" }}
                  className="editor-body w-full p-3.5 text-white text-xs resize-none focus:outline-none focus:border-primary/40 transition-colors placeholder-white/20"
                  required
                />
                <p className="text-[10px] text-on-surface-variant/50 mt-1">{subDescription.length} characters</p>
              </div>

              {/* Repo & Live URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>GitHub / Repository URL</FieldLabel>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">terminal</span>
                    <input type="url" placeholder="https://github.com/..." value={subGithubUrl} onChange={e => setSubGithubUrl(e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Live / Hosted Project URL</FieldLabel>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">language</span>
                    <input type="url" placeholder="https://project.vercel.app" value={subLiveUrl} onChange={e => setSubLiveUrl(e.target.value)} className={`${inputCls} pl-9`} />
                  </div>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <FieldLabel>Demo Video URL <span className="text-on-surface-variant/40 font-normal normal-case tracking-normal">(YouTube, Loom, etc.)</span></FieldLabel>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">smart_display</span>
                  <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={subVideoUrl} onChange={e => setSubVideoUrl(e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              </div>

              {/* Additional Links */}
              <div>
                <FieldLabel>Additional Reference Links</FieldLabel>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input type="text" placeholder="Resource title" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} className={`${inputCls} flex-1`} />
                  <input type="url"  placeholder="https://..." value={newLinkUrl}   onChange={e => setNewLinkUrl(e.target.value)}   className={`${inputCls} flex-1`} />
                  <button type="button" onClick={addLink}
                    className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-semibold rounded-lg px-4 py-2.5 flex items-center gap-1 shrink-0 cursor-pointer text-xs">
                    <span className="material-symbols-outlined text-[15px]">add</span> Add
                  </button>
                </div>
                {subLinks.length > 0 && (
                  <div className="space-y-1.5">
                    {subLinks.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                        <span className="material-symbols-outlined text-primary text-[14px]">link</span>
                        <span className="text-xs font-semibold text-white flex-1 truncate">{l.title}</span>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-on-surface-variant hover:text-primary truncate max-w-[120px] hidden sm:block">{l.url}</a>
                        <button type="button" onClick={() => removeLink(i)} className="text-on-surface-variant hover:text-red-400 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Screenshot image URLs */}
              <div>
                <FieldLabel>Proof Screenshots <span className="text-on-surface-variant/40 font-normal normal-case tracking-normal">(paste public image URLs)</span></FieldLabel>
                <div className="flex gap-2 mb-2">
                  <input type="url" placeholder="https://i.imgur.com/..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} className={`${inputCls} flex-1`} />
                  <button type="button" onClick={addImageUrl}
                    className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-semibold rounded-lg px-4 py-2.5 flex items-center gap-1 shrink-0 cursor-pointer text-xs">
                    <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span> Add
                  </button>
                </div>
                {subImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {subImageUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt={`proof-${i}`}
                          className="w-28 sm:w-36 max-h-[120px] object-cover rounded-xl border border-white/10"
                          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/160x100/0a1426/white?text=Bad+URL"; }} />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="material-symbols-outlined text-red-400 text-[13px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <FieldLabel>Additional Notes &amp; Remarks</FieldLabel>
                <textarea placeholder="Any specific notes, blockers, or clarifications for the reviewer..."
                  value={subNotes} onChange={e => setSubNotes(e.target.value)} rows={3}
                  className={`${inputCls} resize-none`} />
              </div>

              {data.status !== "marked" && (
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-black font-extrabold py-3.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(252,163,17,0.3)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  {isSubmitting
                    ? <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Submitting…</>
                    : <><span className="material-symbols-outlined text-[17px]">upload</span>{data.submission ? "Update Submission" : "Submit Completion Proof"}</>}
                </button>
              )}
            </form>
          </Section>

          {/* Read view of submitted deliverables */}
          {data.submission && (
            <Section title="Submitted Deliverables" icon="inventory_2">
              <div className="space-y-4">
                {data.submission.description && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Completion Write-Up</p>
                    <div className="bg-[#080f1e]/60 border border-white/5 rounded-xl p-4">
                      <pre className="text-xs text-white/85 whitespace-pre-wrap leading-relaxed font-sans">{data.submission.description}</pre>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.submission.github_url && (
                    <a href={data.submission.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-primary/5 rounded-xl transition-all group">
                      <span className="material-symbols-outlined text-primary text-base">terminal</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant font-bold mb-0.5">Repository</p>
                        <p className="text-xs text-white/80 truncate">{data.submission.github_url}</p>
                      </div>
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary ml-auto">open_in_new</span>
                    </a>
                  )}
                  {data.submission.live_url && (
                    <a href={data.submission.live_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-primary/5 rounded-xl transition-all group">
                      <span className="material-symbols-outlined text-primary text-base">language</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant font-bold mb-0.5">Live Preview</p>
                        <p className="text-xs text-white/80 truncate">{data.submission.live_url}</p>
                      </div>
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary ml-auto">open_in_new</span>
                    </a>
                  )}
                  {data.submission.video_url && (
                    <a href={data.submission.video_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-primary/5 rounded-xl sm:col-span-2 transition-all group">
                      <span className="material-symbols-outlined text-primary text-base">smart_display</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant font-bold mb-0.5">Demo Video</p>
                        <p className="text-xs text-white/80 truncate">{data.submission.video_url}</p>
                      </div>
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary ml-auto">open_in_new</span>
                    </a>
                  )}
                </div>
                {(data.submission.additional_links?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Additional Links</p>
                    <div className="space-y-1.5">
                      {(data.submission.additional_links || []).map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-primary/20 rounded-lg transition-all text-xs text-white/80 hover:text-white group">
                          <span className="material-symbols-outlined text-primary text-[14px]">link</span>
                          <span className="font-semibold">{l.title}</span>
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant group-hover:text-primary ml-auto">open_in_new</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {(data.submission.image_urls?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                      Screenshots ({data.submission.image_urls?.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {(data.submission.image_urls || []).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`proof-${i}`}
                            className="w-32 sm:w-44 max-h-[140px] object-cover rounded-xl border border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
                            onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/180x110/0a1426/white?text=Image+Error"; }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {data.submission.notes && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Student Remarks</p>
                    <blockquote className="text-xs text-on-surface-variant/90 border-l-2 border-primary/40 pl-4 py-1 italic leading-relaxed">
                      &ldquo;{data.submission.notes}&rdquo;
                    </blockquote>
                  </div>
                )}
                <p className="text-[10px] text-on-surface-variant/40">
                  Submitted: {new Date(data.submission.submitted_at).toLocaleString()}
                </p>
              </div>
            </Section>
          )}

          {/* Grading Panel */}
          {(data.status === "completed" || data.status === "marked") && (
            <Section title={data.status === "marked" ? "Grading Complete" : "Evaluate & Grade"} icon="grading">
              <form onSubmit={handleGrade} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-3">
                    <FieldLabel required>Score (0–100)</FieldLabel>
                    <input type="number" min="0" max="100" placeholder="e.g. 92"
                      value={gradeScore} onChange={e => setGradeScore(e.target.value)}
                      className="w-full bg-[#080f1e]/60 border border-primary/30 rounded-xl p-3 text-white text-lg font-extrabold text-center focus:outline-none focus:border-primary transition-colors"
                      required />
                    <p className="text-[10px] text-on-surface-variant/50 mt-1 text-center">out of 100</p>
                  </div>
                  <div className="sm:col-span-9">
                    <FieldLabel>Evaluator Feedback</FieldLabel>
                    <textarea placeholder="Provide constructive feedback on the submission quality..."
                      value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} rows={3}
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>
                {gradeScore && !isNaN(Number(gradeScore)) && (
                  <div className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <ScoreRing score={Math.min(100, Math.max(0, Number(gradeScore)))} />
                    <div>
                      <p className="text-xs font-bold text-white">Grade Preview</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {Number(gradeScore) >= 85 ? "🏆 Excellent" :
                         Number(gradeScore) >= 70 ? "✅ Good Pass" :
                         Number(gradeScore) >= 50 ? "⚠️ Needs Improvement" : "❌ Below Standard"}
                      </p>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={isGrading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-black font-extrabold py-3 rounded-xl shadow-[0_6px_20px_rgba(252,163,17,0.25)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  {isGrading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Processing…</>
                    : <><span className="material-symbols-outlined text-[16px]">grading</span>{data.status === "marked" ? "Update Grade" : "Submit Grade"}</>}
                </button>
                {data.status === "marked" && data.feedback && (
                  <div className="p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Previous Feedback</p>
                    <p className="text-xs text-on-surface-variant/90 leading-relaxed">{data.feedback}</p>
                  </div>
                )}
              </form>
            </Section>
          )}

        </div>
      </div>

      {/* Background glows */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
