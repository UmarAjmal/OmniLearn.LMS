"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

// Uses relative /api/* paths → Next.js route handlers proxy to Express backend

interface AdminStats {
  students: number;
  trainers: number;
  courses: number;
  activeTasks: number;
  pendingRegistrations: number;
  submissions: number;
  todayAttendance: number;
  admissionsWeekly: { day: string; count: string }[];
  taskCompletion: { pending: string; completed: string; marked: string };
}

interface FinanceStats {
  totalExpected: number;
  totalCollected: number;
  outstandingFees: number;
  pendingStudents: number;
}

function StatCard({ icon, label, value, sub, accent, href }: { icon: string; label: string; value: string | number; sub?: string; accent?: string; href?: string }) {
  const Inner = (
    <div className={`bg-[#101827] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all group ${href ? "cursor-pointer hover:shadow-lg" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || "bg-[#F6B32B]/10"}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: accent ? "white" : "#F6B32B", fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        {href && <span className="material-symbols-outlined text-white/20 group-hover:text-white/40 transition-colors text-[18px]">arrow_forward</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-white/25 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{Inner}</Link> : Inner;
}

// Mini bar chart
function BarChart({ data, label }: { data: { day: string; count: string }[]; label: string }) {
  const max = Math.max(...data.map((d) => parseInt(d.count) || 0), 1);
  return (
    <div>
      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">{label}</p>
      <div className="flex items-end gap-2 h-24">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white/20 text-sm">No data yet</p>
          </div>
        ) : data.map((d, i) => {
          const height = Math.round(((parseInt(d.count) || 0) / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-white/40">{d.count}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-[#F6B32B] to-[#E09B18] transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
              <span className="text-[9px] text-white/25">{new Date(d.day).toLocaleDateString("en", { weekday: "short" })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut chart
function DonutChart({ pending, completed, marked }: { pending: number; completed: number; marked: number }) {
  const total = pending + completed + marked || 1;
  const pPct = Math.round((pending / total) * 100);
  const cPct = Math.round((completed / total) * 100);
  const mPct = Math.round((marked / total) * 100);

  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = [
    { pct: pending / total, color: "#6366f1", label: "Pending", count: pending },
    { pct: completed / total, color: "#F6B32B", label: "Submitted", count: completed },
    { pct: marked / total, color: "#22c55e", label: "Reviewed", count: marked },
  ];

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {slices.map((slice, i) => {
          const len = slice.pct * circ;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
        <text x="50" y="53" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-white/50">{s.label}</span>
            <span className="text-xs font-bold text-white ml-auto">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/dashboard/admin-stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
      else console.error("admin-stats error:", json.error);

      const fres = await apiClient(`/api/finance/stats`);
      const fjson = await fres.json();
      if (fjson.success) setFinanceStats(fjson.data);
      else console.error("finance-stats error:", fjson.error);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchStats();
  }, [fetchStats, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
      </div>
    );
  }

  const taskPending = parseInt(stats?.taskCompletion?.pending as string) || 0;
  const taskCompleted = parseInt(stats?.taskCompletion?.completed as string) || 0;
  const taskMarked = parseInt(stats?.taskCompletion?.marked as string) || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-white/40 text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — System Overview
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon="school" label="Students" value={stats?.students ?? 0} href="/students" />
        <StatCard icon="badge" label="Trainers" value={stats?.trainers ?? 0} href="/dashboard/trainers" accent="bg-blue-500/15" />
        <StatCard icon="menu_book" label="Courses" value={stats?.courses ?? 0} href="/courses" accent="bg-purple-500/15" />
        <StatCard icon="assignment" label="Active Tasks" value={stats?.activeTasks ?? 0} accent="bg-orange-500/15" />
        <StatCard icon="how_to_reg" label="Pending Admissions" value={stats?.pendingRegistrations ?? 0} href="/students/applicants" accent="bg-red-500/15" sub="Require review" />
        <StatCard icon="task_alt" label="Submissions" value={stats?.submissions ?? 0} accent="bg-emerald-500/15" />
        <StatCard icon="event_available" label="Present Today" value={stats?.todayAttendance ?? 0} sub="Students present" />
        <StatCard icon="verified" label="System Status" value="Online" sub="All services running" accent="bg-emerald-500/15" />
      </div>

      {/* Finance Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Finance Overview</h2>
          <Link href="/dashboard/fees" className="text-[#F6B32B] text-xs font-semibold hover:underline">Manage Fees →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="account_balance" label="Expected Fees" value={`Rs. ${financeStats?.totalExpected ?? 0}`} accent="bg-blue-500/15" />
          <StatCard icon="payments" label="Total Collected" value={`Rs. ${financeStats?.totalCollected ?? 0}`} accent="bg-emerald-500/15" />
          <StatCard icon="money_off" label="Outstanding" value={`Rs. ${financeStats?.outstandingFees ?? 0}`} accent="bg-red-500/15" />
          <StatCard icon="group_remove" label="Pending Students" value={financeStats?.pendingStudents ?? 0} accent="bg-orange-500/15" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Admissions Bar Chart */}
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white">Weekly Admissions</h2>
            <Link href="/students/applicants" className="text-[#F6B32B] text-xs font-semibold hover:underline">View all →</Link>
          </div>
          <BarChart data={stats?.admissionsWeekly ?? []} label="Applications received (last 7 days)" />
        </div>

        {/* Task Completion Donut */}
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white">Task Completion</h2>
            <Link href="/tasks/completed" className="text-[#F6B32B] text-xs font-semibold hover:underline">View all →</Link>
          </div>
          <DonutChart pending={taskPending} completed={taskCompleted} marked={taskMarked} />
          {(taskPending + taskCompleted + taskMarked) === 0 && (
            <p className="text-white/30 text-sm text-center mt-4">No task data yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/students/applicants", icon: "how_to_reg", label: "Review Admissions", color: "from-[#F6B32B] to-[#E09B18]", text: "text-black" },
            { href: "/dashboard/trainers", icon: "person_add", label: "Add Trainer", color: "from-blue-600 to-blue-500", text: "text-white" },
            { href: "/tasks/new", icon: "add_task", label: "Assign Task", color: "from-purple-600 to-purple-500", text: "text-white" },
            { href: "/dashboard/announcements", icon: "campaign", label: "Announce", color: "from-emerald-600 to-emerald-500", text: "text-white" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 flex flex-col gap-2 hover:scale-[1.02] transition-transform shadow-lg`}
            >
              <span className={`material-symbols-outlined text-2xl ${action.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
              <span className={`text-sm font-bold ${action.text}`}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Courses list */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Learning Tracks</h2>
          <Link href="/courses" className="text-[#F6B32B] text-xs font-semibold hover:underline">Manage →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy", color: "bg-purple-500/10 text-purple-400" },
            { id: "web-dev", label: "Web Development", icon: "code", color: "bg-blue-500/10 text-blue-400" },
            { id: "app-dev", label: "App Development", icon: "phone_android", color: "bg-emerald-500/10 text-emerald-400" },
            { id: "devops", label: "DevOps", icon: "cloud_sync", color: "bg-orange-500/10 text-orange-400" },
          ].map((track) => (
            <div key={track.id} className={`${track.color} rounded-xl px-4 py-3 border border-current/20`}>
              <span className="material-symbols-outlined text-2xl block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{track.icon}</span>
              <p className="text-xs font-semibold">{track.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
