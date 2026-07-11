"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  gradedTasks: number;
  pendingTasks: number;
  averageScore: number;
}

interface StudentInfo {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  whatsapp?: string;
  cnic?: string;
  university?: string;
  semester?: number;
  avatar_url?: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async (studentId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${studentId}/dashboard-stats`);
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr) {
      toast.error("Student session details missing. Please re-login.");
      router.push("/");
      return;
    }
    try {
      const studentObj = JSON.parse(infoStr);
      setStudent(studentObj);
      fetchStats(studentObj.id).finally(() => setIsLoading(false));
    } catch {
      toast.error("Failed to parse student session.");
      router.push("/");
    }
  }, [router, fetchStats]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-xs">Loading dashboard stats...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: "Total Milestones", value: stats?.totalTasks ?? 0, icon: "assignment", color: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", iconColor: "text-blue-400" },
    { label: "Pending Objectives", value: stats?.pendingTasks ?? 0, icon: "hourglass_empty", color: "from-yellow-500/10 to-yellow-600/5", border: "border-yellow-500/20", iconColor: "text-yellow-500" },
    { label: "Uploaded Proofs", value: stats?.completedTasks ?? 0, icon: "cloud_upload", color: "from-purple-500/10 to-purple-600/5", border: "border-purple-500/20", iconColor: "text-purple-400" },
    { label: "Graded Milestones", value: stats?.gradedTasks ?? 0, icon: "task_alt", color: "from-green-500/10 to-green-600/5", border: "border-green-500/20", iconColor: "text-green-400" },
  ];

  return (
    <div className="relative text-xs font-sans text-white/90 space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
      `}} />

      {/* Welcome Banner */}
      <div className="glacier-card p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-primary/20">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] uppercase tracking-widest rounded-full">
            Student Executive Workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {student?.first_name} {student?.last_name}!
          </h2>
          <p className="text-on-surface-variant font-light max-w-xl text-xs leading-relaxed">
            Monitor your assigned track parameters, review upcoming deadlines, and submit your completion deliverables.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Enrollment ID</p>
            <p className="text-xs font-extrabold text-white mt-0.5">{student?.enrollment_id || "—"}</p>
            <p className="text-[9px] text-primary/80 font-semibold uppercase tracking-wider mt-1">{student?.program || "N/A"}</p>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl font-light">workspace_premium</span>
        </div>
        {/* Glow overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[90px] rounded-full pointer-events-none" />
      </div>

      {/* Core Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className={`glacier-card bg-gradient-to-br ${card.color} border ${card.border} p-5 rounded-2xl flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
              <p className="text-xl md:text-2xl font-black text-white mt-1">{card.value}</p>
            </div>
            <span className={`material-symbols-outlined ${card.iconColor} text-2xl shrink-0`}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Course Progress Chart/Ring */}
        <div className="glacier-card p-6 rounded-2xl md:col-span-4 flex flex-col justify-center items-center text-center space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-widest self-start">Average Scoring Performance</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#FCA311" strokeWidth="6"
                strokeDasharray="263.89" strokeDashoffset={263.89 - ((stats?.averageScore ?? 0) / 100) * 263.89} strokeLinecap="round"
                transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-black text-white">{stats?.averageScore ?? 0}%</p>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Average Grade</p>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant/80 font-light leading-relaxed max-w-[200px]">
            Your performance index aggregates scores from evaluated tasks. Keep it above 75% for optimal batch rank.
          </p>
        </div>

        {/* Quick Launchpad */}
        <div className="glacier-card p-6 rounded-2xl md:col-span-8 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">Portal Launchpad</h3>
          <p className="text-on-surface-variant text-[11px] font-light">Quickly navigate to critical actions to continue your training deliverables.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { title: "Upload Task Proofs", desc: "Submit completion details, github repository code and screens.", route: "/student/submit-task", icon: "upload", button: "Go to Submission" },
              { title: "View Milestones", desc: "Review all your active, pending and graded course track tasks.", route: "/student/tasks", icon: "assignment_late", button: "Check Tasks" },
              { title: "Complete Profile", desc: "Update your CNIC, university, semester and onboarding details.", route: "/student/profile", icon: "manage_accounts", button: "Modify Profile" }
            ].map((card) => (
              <div key={card.title} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="material-symbols-outlined text-primary text-xl">{card.icon}</span>
                  <h4 className="text-xs font-bold text-white leading-tight">{card.title}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-light">{card.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(card.route)}
                  className="w-full bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary text-[10px] uppercase font-bold py-2 rounded-lg tracking-wider transition-all cursor-pointer text-center"
                >
                  {card.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
