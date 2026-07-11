"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

interface TaskAssignment {
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
  reference_links: { title: string; url: string }[] | string;
}

export default function StudentTasksListPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);

  const fetchTasks = useCallback(async (studentId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/tasks`);
      const json = await res.json();
      if (json.success) {
        setAssignments(json.data || []);
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
    if (!infoStr) {
      toast.error("Session information missing. Re-login.");
      router.push("/");
      return;
    }
    try {
      const studentObj = JSON.parse(infoStr);
      fetchTasks(studentObj.id);
    } catch {
      toast.error("Session corrupt.");
      router.push("/");
    }
  }, [router, fetchTasks]);

  const activeList = assignments.filter(a => a.status === "pending");
  const submittedList = assignments.filter(a => a.status === "completed");
  const gradedList = assignments.filter(a => a.status === "marked");

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      completed: { label: "Submitted", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      marked: { label: "Graded", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    };
    const s = map[status] || { label: status, className: "bg-white/5 text-white/50 border-white/10" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${s.className}`}>
        {s.label}
      </span>
    );
  };

  const getReferenceLinks = (task: TaskAssignment): { title: string; url: string }[] => {
    const r = task.reference_links;
    if (typeof r === "string") {
      try { return JSON.parse(r || "[]"); } catch { return []; }
    }
    return r || [];
  };

  return (
    <div className="relative text-xs font-sans text-white/90 space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .th { color: rgba(206, 229, 255, 0.45); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
        .tr-hover:hover { background: rgba(255, 255, 255, 0.02); }
      `}} />

      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Milestone Objectives Registry</h2>
        <p className="text-on-surface-variant font-light mt-1 font-sans text-xs">
          Explore and audit your assigned batch milestones, grading criteria, and evaluator feedback logs.
        </p>
      </div>

      {isLoading ? (
        <div className="glacier-card p-16 rounded-2xl text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-xs">Loading task registry...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* List 1: Active In-Progress Tasks */}
          <div className="glacier-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Active Assignments</h3>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks currently awaiting your implementation and summary submissions.</p>
              </div>
              <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-[11px] px-3 py-1 rounded-full">
                {activeList.length} Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0a1426]/30">
                    <th className="px-6 py-3.5 th">Task Details</th>
                    <th className="px-6 py-3.5 th">Assigned Track</th>
                    <th className="px-6 py-3.5 th">Due Date</th>
                    <th className="px-6 py-3.5 th">XP Reward</th>
                    <th className="px-6 py-3.5 th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-on-surface-variant/50 font-light">
                        No active milestones assigned. Great job staying up to date!
                      </td>
                    </tr>
                  ) : (
                    activeList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(a)}
                            className="font-bold text-white hover:text-primary hover:underline text-left cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            {a.task_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{a.course_label}</td>
                        <td className="px-6 py-4 text-white/80">
                          {a.due_date ? new Date(a.due_date).toLocaleDateString() : "No Limit"}
                        </td>
                        <td className="px-6 py-4 text-primary font-bold">{a.points} XP</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => router.push("/student/submit-task")}
                            className="px-3.5 py-2 bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">upload</span>
                            Submit Proof
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* List 2: Submitted / Awaiting review */}
          <div className="glacier-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Completions Submitted</h3>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks you completed and uploaded. Evaluator reviews are pending.</p>
              </div>
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[11px] px-3 py-1 rounded-full">
                {submittedList.length} Under Review
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0a1426]/30">
                    <th className="px-6 py-3.5 th">Task Details</th>
                    <th className="px-6 py-3.5 th">Assigned Track</th>
                    <th className="px-6 py-3.5 th">Status</th>
                    <th className="px-6 py-3.5 th">XP Value</th>
                    <th className="px-6 py-3.5 th text-right">Audits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {submittedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-on-surface-variant/50 font-light">
                        No submissions pending review.
                      </td>
                    </tr>
                  ) : (
                    submittedList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(a)}
                            className="font-bold text-white hover:text-primary hover:underline text-left cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            {a.task_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{a.course_label}</td>
                        <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-4 text-white/80">{a.points} XP</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(a)}
                            className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all cursor-pointer inline-flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* List 3: Graded Milestones */}
          <div className="glacier-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Graded Deliverables</h3>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Tasks completed, marked, and officially evaluated by senior trainers.</p>
              </div>
              <span className="bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[11px] px-3 py-1 rounded-full">
                {gradedList.length} Graded
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0a1426]/30">
                    <th className="px-6 py-3.5 th">Task Details</th>
                    <th className="px-6 py-3.5 th">Assigned Track</th>
                    <th className="px-6 py-3.5 th">Score Grade</th>
                    <th className="px-6 py-3.5 th">Graded Date</th>
                    <th className="px-6 py-3.5 th text-right">Audits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {gradedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-on-surface-variant/50 font-light">
                        No graded deliverables logged yet.
                      </td>
                    </tr>
                  ) : (
                    gradedList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(a)}
                            className="font-bold text-white hover:text-primary hover:underline text-left cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                          >
                            {a.task_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{a.course_label}</td>
                        <td className="px-6 py-4 text-sm font-extrabold text-primary">
                          {a.score}%
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant/80">
                          {a.graded_at ? new Date(a.graded_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(a)}
                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all cursor-pointer text-[10px] uppercase inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">speaker_notes</span>
                            Feedback
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Task Details Dialog Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glacier-card w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#101f38] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Milestone Specifications</h4>
                  <p className="text-[10px] text-on-surface-variant">Review task specification guidelines and feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-on-surface-variant hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Task Name</span>
                <p className="text-xs font-bold text-white bg-[#0a1426]/30 p-2.5 rounded-lg border border-white/5">{selectedTask.task_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Description &amp; Guidelines</span>
                <p className="text-xs text-on-surface-variant/90 leading-relaxed font-light whitespace-pre-wrap bg-[#0a1426]/30 p-3 rounded-lg border border-white/5">
                  {selectedTask.task_description || "No description provided."}
                </p>
              </div>

              {getReferenceLinks(selectedTask).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Reference Links</span>
                  <div className="space-y-1">
                    {getReferenceLinks(selectedTask).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80"
                      >
                        <span className="material-symbols-outlined text-primary text-sm">link</span>
                        <span className="truncate flex-1">{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Score and feedback if graded */}
              {selectedTask.status === "marked" && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl p-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Evaluation Score</p>
                      <p className="text-2xl font-black text-white mt-1">{selectedTask.score}%</p>
                    </div>
                    <span className="material-symbols-outlined text-green-400 text-3xl">workspace_premium</span>
                  </div>

                  {selectedTask.feedback && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Evaluator Feedback</span>
                      <blockquote className="text-xs text-on-surface-variant/90 border-l-2 border-primary/40 pl-4 py-1 italic leading-relaxed">
                        "{selectedTask.feedback}"
                      </blockquote>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
