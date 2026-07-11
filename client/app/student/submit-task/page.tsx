"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

interface TaskAssignment {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  task_name: string;
  task_description: string;
  points: number;
  due_date: string | null;
  reference_links: { title: string; url: string }[] | string;
}

export default function SubmitTaskPage() {
  const router = useRouter();
  
  const [studentId, setStudentId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editor states (Applied locally/visually in textarea)
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch student assigned tasks
  const fetchTasks = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${id}/tasks`);
      const json = await res.json();
      if (json.success) {
        // Only keep pending ones for submission
        const pending = (json.data || []).filter((t: TaskAssignment) => t.status === "pending");
        setAssignments(pending);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
      toast.error("Failed to fetch assigned tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    const userId = localStorage.getItem("lms_user_id");

    const handleLogout = () => {
      localStorage.removeItem("lms_auth");
      localStorage.removeItem("lms_user_role");
      localStorage.removeItem("lms_user_id");
      localStorage.removeItem("lms_student_info");
      router.push("/");
    };

    if (!infoStr || infoStr === "undefined" || infoStr === "null") {
      if (userId) {
        fetch(`${API_BASE_URL}/api/students/profile?userId=${userId}`)
          .then(r => r.json())
          .then(json => {
            if (json.success && json.data) {
              localStorage.setItem("lms_student_info", JSON.stringify(json.data));
              setStudentId(json.data.id);
              fetchTasks(json.data.id);
            } else {
              toast.error("Session missing. Please re-login.");
              handleLogout();
            }
          })
          .catch(() => {
            toast.error("Network error. Please try again.");
          });
      } else {
        toast.error("Session details missing. Please re-login.");
        handleLogout();
      }
      return;
    }

    try {
      const studentObj = JSON.parse(infoStr);
      if (studentObj && studentObj.id) {
        setStudentId(studentObj.id);
        fetchTasks(studentObj.id);
      } else {
        toast.error("Session details missing. Please re-login.");
        handleLogout();
      }
    } catch {
      toast.error("Failed to parse student session.");
      handleLogout();
    }
  }, [router, fetchTasks]);

  const selectedAssignment = assignments.find(
    (a) => String(a.assignment_id) === selectedAssignmentId
  );

  // Format reference links
  const getReferenceLinks = (): { title: string; url: string }[] => {
    if (!selectedAssignment) return [];
    const r = selectedAssignment.reference_links;
    if (typeof r === "string") {
      try {
        return JSON.parse(r || "[]");
      } catch {
        return [];
      }
    }
    return r || [];
  };

  // Additional link builders
  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.warning("Fill title and URL."); return;
    }
    if (!/^https?:\/\//i.test(newLinkUrl)) {
      toast.warning("URL must start with http:// or https://"); return;
    }
    setLinks(prev => [...prev, { title: newLinkTitle.trim(), url: newLinkUrl.trim() }]);
    setNewLinkTitle(""); setNewLinkUrl("");
  };
  const removeLink = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx));

  // Screenshot builders
  const addImage = () => {
    if (!newImageUrl.trim()) { toast.warning("Enter an image URL."); return; }
    if (!/^https?:\/\//i.test(newImageUrl)) {
      toast.warning("URL must start with http:// or https://"); return;
    }
    setImageUrls(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };
  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));

  // Text formatting
  const wrap = (pre: string, suf = pre) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    const nv = value.slice(0, s) + pre + sel + suf + value.slice(e);
    setDescription(nv);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + pre.length, e + pre.length); }, 0);
  };
  const linePrefix = (pfx: string) => {
    setDescription(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + pfx);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Submit proof
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) {
      toast.error("Please select a milestone to submit."); return;
    }
    if (!description.trim()) {
      toast.error("Please describe your work completion guidelines."); return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/assignments/${selectedAssignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description, githubUrl, liveUrl, videoUrl, notes, additionalLinks: links, imageUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Submission failed.");
      } else {
        toast.success("🎉 Deliverable submitted successfully!");
        // Reset form & reload
        setSelectedAssignmentId("");
        setDescription("");
        setGithubUrl("");
        setLiveUrl("");
        setVideoUrl("");
        setNotes("");
        setLinks([]);
        setImageUrls([]);
        if (studentId) fetchTasks(studentId);
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ToolBtn = ({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) => (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded flex items-center justify-center transition-all ${
        active ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-[17px]">{icon}</span>
    </button>
  );

  return (
    <div className="relative text-xs font-sans text-white/90 max-w-5xl mx-auto space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .editor-toolbar { background: rgba(12, 22, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-bottom: none; border-radius: 10px 10px 0 0; }
        .editor-body { background: rgba(8, 15, 30, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0 0 10px 10px; }
      `}} />

      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Submit Milestone Proof</h2>
        <p className="text-on-surface-variant font-light mt-1">
          Upload deliverable summaries, source code links and prototype previews for review.
        </p>
      </div>

      {isLoading ? (
        <div className="glacier-card p-16 rounded-2xl text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-xs">Loading pending milestones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Submission Form */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glacier-card p-6 rounded-2xl">
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Select Task */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Target Milestone / Task *
                  </label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                    required
                  >
                    <option value="" className="bg-[#0b132b]">-- Select a pending assignment --</option>
                    {assignments.map((a) => (
                      <option key={a.assignment_id} value={a.assignment_id} className="bg-[#0b132b]">
                        {a.task_name} ({a.points} XP)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Office word style text summary */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Completion summary / proof description *
                  </label>
                  
                  <div className="editor-toolbar flex flex-wrap items-center gap-0.5 px-2 py-1.5">
                    <ToolBtn icon="format_bold" label="Bold" active={isBold} onClick={() => { setIsBold(!isBold); wrap("**","**"); }} />
                    <ToolBtn icon="format_italic" label="Italic" active={isItalic} onClick={() => { setIsItalic(!isItalic); wrap("_","_"); }} />
                    <ToolBtn icon="code" label="Code Font" active={isCode} onClick={() => { setIsCode(!isCode); wrap("`","`"); }} />
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <ToolBtn icon="format_list_bulleted" label="Bullet List" onClick={() => linePrefix("- ")} />
                    <ToolBtn icon="format_list_numbered" label="Numbered List" onClick={() => linePrefix("1. ")} />
                    <ToolBtn icon="format_quote" label="Quote Block" onClick={() => linePrefix("> ")} />
                    <ToolBtn icon="code_blocks" label="Block code" onClick={() => wrap("\n```\n","\n```")} />
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <ToolBtn icon="title" label="Heading" onClick={() => linePrefix("## ")} />
                    <ToolBtn icon="horizontal_rule" label="Divider" onClick={() => linePrefix("\n---\n")} />
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    placeholder="Describe how you completed the tasks, key features implemented, technologies used and instructions to test your prototype..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    style={{
                      fontWeight: isBold ? "bold" : "normal",
                      fontStyle: isItalic ? "italic" : "normal",
                      fontFamily: isCode ? "'Fira Code', monospace" : "inherit"
                    }}
                    className="editor-body w-full p-3.5 text-white text-xs resize-none focus:outline-none focus:border-primary/40 transition-all placeholder-white/20"
                    required
                  />
                </div>

                {/* Primary Repo and Prototype Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                      Hosted / Live Preview URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Demo Video URL */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Demo Video URL (Loom / Youtube)
                  </label>
                  <input
                    type="url"
                    placeholder="https://loom.com/share/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                  />
                </div>

                {/* Additional Reference Links */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Other Reference URLs
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Link title (e.g. API Docs)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="flex-1 bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="flex-1 bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={addLink}
                      className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-bold text-xs uppercase cursor-pointer"
                    >Add</button>
                  </div>
                  {links.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {links.map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                          <div className="truncate flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">link</span>
                            <span className="font-semibold text-white">{l.title}</span>
                            <span className="text-on-surface-variant/70 text-[10px]">({l.url})</span>
                          </div>
                          <button type="button" onClick={() => removeLink(i)} className="text-on-surface-variant hover:text-red-400">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screenshot Image Proofs */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    Screenshot / Image Proofs
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://i.imgur.com/your-screenshot.png"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-bold text-xs uppercase cursor-pointer"
                    >Attach</button>
                  </div>
                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imageUrls.map((url, i) => (
                        <div key={url} className="relative group">
                          <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-white/10" onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/100x60/0a1426/white?text=Img+Error"; }} />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-black/75 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-red-400 text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Evaluator Remarks / Notes
                  </label>
                  <textarea
                    placeholder="Any comments, doubts, questions or difficulties encountered to share with evaluator..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedAssignmentId}
                  className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 text-black py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_8px_24px_-4px_rgba(252,163,17,0.3)] cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Submitting Deliverable...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[17px]">send</span> Submit Completion Proof</>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* Right Column: Task Guidelines details card */}
          <div className="lg:col-span-4">
            <div className="glacier-card p-6 rounded-2xl h-full flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-white mb-1">Task Guidelines</h3>
                  <p className="text-on-surface-variant text-[11px]">Select a task from dropdown to load instructions.</p>
                </div>
                
                {selectedAssignment ? (
                  <div className="space-y-4">
                    <div className="border-t border-b border-white/5 py-3 space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Title</p>
                      <p className="text-xs font-bold text-white">{selectedAssignment.task_name}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Instructions</p>
                      <p className="text-xs text-on-surface-variant/90 leading-relaxed font-light whitespace-pre-wrap">
                        {selectedAssignment.task_description || "No specific instructions provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Points Reward</p>
                        <p className="text-xs font-bold text-primary">{selectedAssignment.points} XP</p>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Due Date</p>
                        <p className="text-xs font-bold text-white">
                          {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : "No Limit"}
                        </p>
                      </div>
                    </div>

                    {getReferenceLinks().length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Admin Resources</p>
                        {getReferenceLinks().map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/5 hover:bg-white/5 rounded-lg text-xs text-white/80 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-primary text-sm">link</span>
                            <span className="truncate flex-1">{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-on-surface-variant/45 font-light">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-on-surface-variant/20">quick_reference_all</span>
                    Select an active milestone task from the left form to inspect guidelines.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
