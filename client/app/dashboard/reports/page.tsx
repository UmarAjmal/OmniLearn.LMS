"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

// Uses relative /api/* paths → Next.js route handlers proxy to Express backend

export default function AdminReportsPage() {
  const router = useRouter();
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [studentReport, setStudentReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "attendance">("students");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, studRes] = await Promise.all([
        apiClient(`/api/attendance/summary`),
        apiClient(`/api/students/full-report`),
      ]);
      const attJson = await attRes.json();
      const studJson = await studRes.json();
      if (attJson.success) setAttendanceSummary(attJson.data || []);
      else console.error("Attendance summary error:", attJson.error);
      if (studJson.success) setStudentReport(studJson.data || []);
      else console.error("Student full-report error:", studJson.error);
    } catch (err) {
      console.error("fetchReports error:", err);
      toast.error("Failed to load reports.");
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchReports();
  }, [fetchReports, router]);

  const getGradeColor = (score?: number) => {
    if (!score) return "text-white/30";
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-[#F6B32B]";
    return "text-red-400";
  };

  const getAttPct = (row: any) => {
    const total = parseInt(row.total_days) || 0;
    const present = parseInt(row.present_count) + parseInt(row.late_count || 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Reports</h1>
        <p className="text-white/40 text-sm">Analytics and performance reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "students", label: "Student Performance", icon: "trending_up" },
          { key: "attendance", label: "Attendance Report", icon: "event_available" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-[#F6B32B] text-black"
                : "bg-white/[0.04] text-white/50 border border-white/[0.08] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : activeTab === "students" ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
            <span>Student</span><span>Program</span><span>Tasks</span><span>Avg Score</span><span>Attendance</span>
          </div>
          {studentReport.length === 0 ? (
            <div className="p-14 text-center"><p className="text-white/30 text-sm">No data yet</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {studentReport.map((s) => {
                const attPct = s.total_attendance > 0 ? Math.round((s.present_days / s.total_attendance) * 100) : 0;
                return (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.06]">
                        {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-white/50 font-bold text-sm">{(s.first_name || "?")[0]}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.first_name} {s.last_name}</p>
                        <p className="text-[11px] text-white/30 truncate">{s.enrollment_id}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#F6B32B] font-semibold">{s.program || "—"}</span>
                    <span className="text-sm text-white/60"><span className="font-bold text-white">{s.graded_tasks ?? 0}</span> / {s.total_tasks ?? 0}</span>
                    <span className={`text-sm font-bold ${getGradeColor(parseFloat(s.avg_score))}`}>{s.avg_score != null ? `${s.avg_score}%` : "—"}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${attPct >= 75 ? "bg-emerald-500" : attPct >= 50 ? "bg-[#F6B32B]" : "bg-red-500"}`} style={{ width: `${attPct}%` }} />
                      </div>
                      <span className="text-xs text-white/50 w-8 text-right">{attPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
            <span>Student</span><span>Present</span><span>Absent</span><span>Late</span><span>Leave</span><span>Rate</span>
          </div>
          {attendanceSummary.length === 0 ? (
            <div className="p-14 text-center"><p className="text-white/30 text-sm">No attendance data yet</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {attendanceSummary.map((row) => {
                const pct = getAttPct(row);
                return (
                  <div key={row.student_id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.first_name} {row.last_name}</p>
                      <p className="text-[11px] text-white/30">{row.enrollment_id}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{row.present_count ?? 0}</span>
                    <span className="text-sm font-bold text-red-400">{row.absent_count ?? 0}</span>
                    <span className="text-sm font-bold text-orange-400">{row.late_count ?? 0}</span>
                    <span className="text-sm font-bold text-blue-400">{row.leave_count ?? 0}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-[#F6B32B]" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-white/50">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
