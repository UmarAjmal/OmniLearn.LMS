"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface Stats {
  totalStudents: number;
  pendingReviews: number;
  assignedTasks: number;
  submissions: number;
  totalAssignments: number;
  todayAttendance: number;
  submissionRate: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent || "bg-[#F6B32B]/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{
              color: accent ? "white" : "#F6B32B",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {icon}
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        fetch(`/api/trainers/dashboard-stats`),
        fetch(`/api/tasks/submitted`),
      ]);
      const statsJson = await statsRes.json();
      const submissionsJson = await submissionsRes.json();
      if (statsJson.success) setStats(statsJson.data);
      if (submissionsJson.success) setRecentSubmissions(submissionsJson.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load trainer dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const submissionRate = stats?.submissionRate ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Trainer Dashboard</h1>
        <p className="text-white/40 text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon="group" label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard icon="assignment" label="Tasks Assigned" value={stats?.assignedTasks ?? 0} />
        <StatCard icon="rate_review" label="Pending Reviews" value={stats?.pendingReviews ?? 0} sub="Awaiting feedback" accent="bg-orange-500/15" />
        <StatCard icon="task_alt" label="Submissions" value={stats?.submissions ?? 0} />
        <StatCard icon="event_available" label="Today's Attendance" value={stats?.todayAttendance ?? 0} sub="Present today" accent="bg-emerald-500/15" />
        <StatCard icon="percent" label="Submission Rate" value={`${submissionRate}%`} sub="Of all assignments" accent={submissionRate >= 70 ? "bg-emerald-500/15" : "bg-red-500/15"} />
      </div>

      {/* Submission Rate Bar */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Weekly Progress</h2>
          <span className="text-[#F6B32B] font-bold text-sm">{submissionRate}%</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F6B32B] to-[#E09B18] transition-all duration-700"
            style={{ width: `${submissionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-white/30">
          <span>Submission Rate</span>
          <span>{stats?.submissions ?? 0} / {stats?.totalAssignments ?? 0} tasks submitted</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/tasks/new", icon: "add_task", label: "Assign New Task", color: "from-[#F6B32B] to-[#E09B18]", text: "text-black" },
          { href: "/trainer/submitted-tasks", icon: "inbox", label: "View Submissions", color: "from-blue-600 to-blue-500", text: "text-white" },
          { href: "/trainer/attendance", icon: "event_available", label: "Mark Attendance", color: "from-emerald-600 to-emerald-500", text: "text-white" },
          { href: "/trainer/announcements", icon: "campaign", label: "Post Announcement", color: "from-purple-600 to-purple-500", text: "text-white" },
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

      {/* Recent Submissions */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">Recent Submissions</h2>
          <Link href="/trainer/submitted-tasks" className="text-[#F6B32B] text-xs font-semibold hover:underline">View all →</Link>
        </div>
        {recentSubmissions.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">inbox</span>
            <p className="text-white/30 text-sm">No submissions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentSubmissions.map((sub) => (
              <div key={sub.assignment_id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 border border-white/[0.06]">
                  {sub.avatar_url ? (
                    <img src={sub.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-white/50 font-bold text-sm">
                      {(sub.first_name || "?")[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{sub.first_name} {sub.last_name}</p>
                  <p className="text-xs text-white/40 truncate">{sub.task_name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    sub.status === "marked" ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"
                  }`}>
                    {sub.status === "marked" ? "Reviewed" : "Pending Review"}
                  </span>
                  <Link
                    href={`/trainer/submitted-tasks`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F6B32B]/10 hover:bg-[#F6B32B]/20 text-[#F6B32B] rounded-lg text-[10px] font-bold transition-all"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
