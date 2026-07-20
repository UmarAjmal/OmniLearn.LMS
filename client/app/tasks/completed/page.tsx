"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";


const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "web-dev",      label: "Web Development",       icon: "code" },
  { id: "app-dev",      label: "App Development",       icon: "phone_android" },
  { id: "devops",       label: "DevOps",                icon: "cloud_sync" },
];

interface Assignment {
  assignment_id: number;
  task_id: number;
  student_id: number;
  status: "pending" | "completed" | "marked";
  score: number | null;
  graded_at: string | null;
  assigned_at: string;
  task_name: string;
  task_description: string;
  course_id: string;
  course_label: string;
  points: number;
  due_date: string | null;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  email: string;
}

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:   { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    completed: { label: "Submitted",   className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    marked:    { label: "Graded",      className: "bg-green-500/10 text-green-400 border-green-500/20" },
  };
  const s = map[status] || { label: status, className: "bg-white/5 text-white/50 border-white/10" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${s.className}`}>
      {s.label}
    </span>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-10 text-on-surface-variant/50 font-light text-xs">
        <span className="material-symbols-outlined block text-2xl mb-2 text-on-surface-variant/20">inbox</span>
        {message}
      </td>
    </tr>
  );
}

export default function CompletedTasksPage() {
  const [selectedCourse, setSelectedCourse] = useState("fullstack-ai");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/assignments/by-course/${courseId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load task assignments.");
        setAssignments([]);
      } else {
        setAssignments(json.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Could not reach the server.");
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments(selectedCourse);
  }, [selectedCourse, fetchAssignments]);

  const handleOpenReview = (assignmentId: number) => {
    window.open(`/trainer/submitted-tasks`, "_blank", "noopener,noreferrer");
  };

  const submittedList = assignments.filter(a => a.status === "completed");
  const pendingList   = assignments.filter(a => a.status === "pending");
  const markedList    = assignments.filter(a => a.status === "marked");

  return (
    <div className="relative text-xs font-sans text-white/90">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .th { color: rgba(206,229,255,0.45); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; font-size:10px; }
        .tr-hover:hover { background: rgba(255,255,255,0.02); }
      `}} />

      <div className="p-2 md:p-6 w-full max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Complete Tasks Audit</h2>
          <p className="text-on-surface-variant font-light text-xs mt-1">
            Review student task completions, grade deliverables, and monitor learning progress.
          </p>
        </div>

        {/* Course Filter */}
        <div className="glacier-card p-4 rounded-2xl">
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5">
            Filter by Course Department
          </label>
          <div className="flex flex-wrap gap-2">
            {COURSES.map(course => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourse(course.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedCourse === course.id
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(252,163,17,0.15)]"
                    : "border-white/10 bg-white/5 text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{course.icon}</span>
                {course.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error or Loading */}
        {error && (
          <div className="glacier-card p-4 rounded-xl flex items-center gap-3 border-red-500/20">
            <span className="material-symbols-outlined text-red-400">error</span>
            <p className="text-red-400 text-xs">{error}</p>
            <button
              type="button"
              onClick={() => fetchAssignments(selectedCourse)}
              className="ml-auto text-xs text-primary underline cursor-pointer"
            >Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="glacier-card p-16 rounded-2xl text-center">
            <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
            <p className="text-on-surface-variant text-xs font-light">Loading assignments for this course...</p>
          </div>
        ) : (
          <>
            {/* ── List 1: Submitted & Awaiting Review ── */}
            <div className="glacier-card rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Completions Submitted</h3>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    Tasks uploaded by students awaiting evaluation.
                  </p>
                </div>
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[11px] px-3 py-1 rounded-full">
                  {submittedList.length} Awaiting
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0a1426]/30">
                      <th className="px-6 py-3.5 th">Name</th>
                      <th className="px-6 py-3.5 th">Course</th>
                      <th className="px-6 py-3.5 th">Task Name</th>
                      <th className="px-6 py-3.5 th">Status</th>
                      <th className="px-6 py-3.5 th text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {submittedList.length === 0 ? (
                      <EmptyRow cols={5} message="No submissions awaiting review for this course." />
                    ) : submittedList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors">
                        <td className="px-6 py-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <img src={DEFAULT_AVATAR} alt="" className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                            {a.first_name} {a.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-on-surface-variant">{a.course_label}</td>
                        <td className="px-6 py-3.5 text-white/90 font-medium max-w-[220px] truncate">{a.task_name}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(a.assignment_id)}
                            className="p-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Open review in new tab"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── List 2: Pending (locked) ── */}
            <div className="glacier-card rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Pending Assignments</h3>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    Tasks currently in-progress by students.
                  </p>
                </div>
                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-[11px] px-3 py-1 rounded-full">
                  {pendingList.length} Active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0a1426]/30">
                      <th className="px-6 py-3.5 th">Name</th>
                      <th className="px-6 py-3.5 th">Course</th>
                      <th className="px-6 py-3.5 th">Task Name</th>
                      <th className="px-6 py-3.5 th">Status</th>
                      <th className="px-6 py-3.5 th text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingList.length === 0 ? (
                      <EmptyRow cols={5} message="No pending assignments for this course." />
                    ) : pendingList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors opacity-70">
                        <td className="px-6 py-3.5 font-bold text-white/80">
                          <div className="flex items-center gap-2">
                            <img src={DEFAULT_AVATAR} alt="" className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                            {a.first_name} {a.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-on-surface-variant/70">{a.course_label}</td>
                        <td className="px-6 py-3.5 text-white/70 max-w-[220px] truncate">{a.task_name}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            disabled
                            className="p-1.5 rounded-full bg-white/5 border border-white/5 text-on-surface-variant/30 cursor-not-allowed inline-flex items-center justify-center"
                            title="Submission not yet uploaded"
                          >
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── List 3: Graded / Marked ── */}
            <div className="glacier-card rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Graded Deliverables</h3>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    Tasks reviewed, scored, and officially marked by the evaluator.
                  </p>
                </div>
                <span className="bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[11px] px-3 py-1 rounded-full">
                  {markedList.length} Graded
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0a1426]/30">
                      <th className="px-6 py-3.5 th">Name</th>
                      <th className="px-6 py-3.5 th">Course</th>
                      <th className="px-6 py-3.5 th">Task Name</th>
                      <th className="px-6 py-3.5 th">Status</th>
                      <th className="px-6 py-3.5 th text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {markedList.length === 0 ? (
                      <EmptyRow cols={5} message="No graded deliverables for this course yet." />
                    ) : markedList.map(a => (
                      <tr key={a.assignment_id} className="tr-hover transition-colors">
                        <td className="px-6 py-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <img src={DEFAULT_AVATAR} alt="" className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                            {a.first_name} {a.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-on-surface-variant">{a.course_label}</td>
                        <td className="px-6 py-3.5 text-white/90 font-medium max-w-[220px] truncate">{a.task_name}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`text-sm font-extrabold ${
                            (a.score ?? 0) >= 80 ? "text-green-400" :
                            (a.score ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {a.score ?? "—"}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Decorative glows */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
