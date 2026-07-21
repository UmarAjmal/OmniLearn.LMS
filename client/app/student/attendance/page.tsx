"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


interface AttendanceRecord {
  id: number;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  notes: string | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendancePercent: number;
}

const STATUS_CONFIG = {
  present: { color: "text-emerald-400", bg: "bg-emerald-500", icon: "check_circle", label: "Present" },
  absent: { color: "text-red-400", bg: "bg-red-500", icon: "cancel", label: "Absent" },
  late: { color: "text-orange-400", bg: "bg-orange-500", icon: "schedule", label: "Late" },
  leave: { color: "text-blue-400", bg: "bg-blue-500", icon: "event_busy", label: "Leave" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StudentAttendancePage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const fetchAttendance = useCallback(async (id: number, month: number, year: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/attendance/student/${id}?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setStats(json.stats || null);
      }
    } catch { toast.error("Failed to load attendance."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined") { router.push("/"); return; }
    try {
      const student = JSON.parse(infoStr);
      setStudentId(student.id);
      fetchAttendance(student.id, selectedMonth, selectedYear);
    } catch { router.push("/"); }
  }, [router, fetchAttendance, selectedMonth, selectedYear]);

  // Build calendar grid
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const recordMap = Object.fromEntries(records.map((r) => [new Date(r.date).getDate(), r]));

  const AttendanceStat = ({ label, count, pct, status }: { label: string; count: number; pct?: number; status: keyof typeof STATUS_CONFIG }) => (
    <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${STATUS_CONFIG[status].bg}/15`}>
        <span className={`material-symbols-outlined text-[20px] ${STATUS_CONFIG[status].color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{STATUS_CONFIG[status].icon}</span>
      </div>
      <p className={`text-3xl font-bold ${STATUS_CONFIG[status].color}`}>{pct != null ? `${pct}%` : count}</p>
      <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{label}</p>
      {pct != null && <p className="text-[11px] text-white/25 mt-0.5">{count} days</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Attendance</h1>
        <p className="text-white/40 text-sm">Track your attendance history and stats</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AttendanceStat label="Attendance Rate" count={stats?.present ?? 0} pct={stats?.attendancePercent} status="present" />
        <AttendanceStat label="Present" count={stats?.present ?? 0} status="present" />
        <AttendanceStat label="Absent" count={stats?.absent ?? 0} status="absent" />
        <AttendanceStat label="Late" count={stats?.late ?? 0} status="late" />
      </div>

      {/* Month Picker */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => {
          if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
          else setSelectedMonth(m => m - 1);
        }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <p className="text-base font-bold text-white min-w-[140px] text-center">
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </p>
        <button onClick={() => {
          if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
          else setSelectedMonth(m => m + 1);
        }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-white/30 uppercase py-1">{d}</div>
          ))}
        </div>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const record = recordMap[day];
              const isToday = day === today.getDate() && selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
              return (
                <div
                  key={day}
                  title={record ? STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]?.label : "No record"}
                  className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all relative ${
                    record
                      ? record.status === "present" ? "bg-emerald-500/15 text-emerald-400"
                      : record.status === "absent" ? "bg-red-500/15 text-red-400"
                      : record.status === "late" ? "bg-orange-500/15 text-orange-400"
                      : "bg-blue-500/15 text-blue-400"
                      : isToday ? "bg-[#F6B32B]/10 text-[#F6B32B] ring-1 ring-[#F6B32B]/30"
                      : "text-white/30 hover:bg-white/5"
                  }`}
                >
                  {day}
                  {record && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]?.bg}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
            <span className="text-xs text-white/50">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">Attendance History</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-white/20 text-4xl block mb-2">event_available</span>
            <p className="text-white/30 text-sm">No attendance records for this month</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {[...records].reverse().map((record) => {
              const cfg = STATUS_CONFIG[record.status];
              return (
                <div key={record.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg}/15 shrink-0`}>
                    <span className={`material-symbols-outlined text-[16px] ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {record.notes && <p className="text-[11px] text-white/30 mt-0.5">{record.notes}</p>}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg}/15 ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
