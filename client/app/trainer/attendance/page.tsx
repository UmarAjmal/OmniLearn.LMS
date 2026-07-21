"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url: string | null;
}

type AttendanceStatus = "present" | "absent" | "late" | "leave";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: string }> = {
  present: { label: "Present", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: "check_circle" },
  absent: { label: "Absent", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: "cancel" },
  late: { label: "Late", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", icon: "schedule" },
  leave: { label: "Leave", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", icon: "event_busy" },
};

export default function TrainerAttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState<Record<number, AttendanceStatus>>({});

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
        // Default all to present
        const defaults: Record<number, AttendanceStatus> = {};
        (json.data || []).forEach((s: Student) => { defaults[s.id] = "present"; });
        setAttendance(defaults);
      }
    } catch {
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExistingAttendance = useCallback(async (date: string) => {
    try {
      const res = await apiClient(`/api/attendance/date/${date}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const map: Record<number, AttendanceStatus> = {};
        json.data.forEach((r: any) => { map[r.student_id] = r.status; });
        setExistingRecords(map);
        setAttendance((prev) => ({ ...prev, ...map }));
      } else {
        setExistingRecords({});
      }
    } catch {}
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchStudents();
  }, [fetchStudents, router]);

  useEffect(() => {
    if (selectedDate) fetchExistingAttendance(selectedDate);
  }, [selectedDate, fetchExistingAttendance]);

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!selectedDate) { toast.error("Please select a date."); return; }
    setIsSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendance[s.id] || "present",
      }));
      const res = await apiClient(`/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date: selectedDate }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Attendance saved for ${records.length} students!`);
        fetchExistingAttendance(selectedDate);
      } else {
        toast.error(json.error || "Failed to save.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount = Object.values(attendance).filter((v) => v === "absent").length;
  const lateCount = Object.values(attendance).filter((v) => v === "late").length;
  const leaveCount = Object.values(attendance).filter((v) => v === "leave").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Mark Attendance</h1>
        <p className="text-white/40 text-sm">Select a date and mark attendance for each student</p>
      </div>

      {/* Date + bulk actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-3 bg-[#101827] border border-white/[0.08] rounded-xl px-4 py-2.5">
          <span className="material-symbols-outlined text-[#F6B32B] text-[20px]">calendar_today</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none"
          />
          {Object.keys(existingRecords).length > 0 && (
            <span className="text-[11px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Saved</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setAllStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`}
            >
              Mark All {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Present", count: presentCount, color: "text-emerald-400" },
          { label: "Absent", count: absentCount, color: "text-red-400" },
          { label: "Late", count: lateCount, color: "text-orange-400" },
          { label: "Leave", count: leaveCount, color: "text-blue-400" },
        ].map((item) => (
          <div key={item.label} className="bg-[#101827] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">group</span>
          <p className="text-white/40 text-sm">No students found</p>
        </div>
      ) : (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
          <div className="divide-y divide-white/[0.04]">
            {students.map((student) => {
              const status = attendance[student.id] || "present";
              return (
                <div key={student.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 border border-white/[0.06] overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-white/50 font-bold">{(student.first_name || "?")[0]}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{student.first_name} {student.last_name}</p>
                    <p className="text-[11px] text-white/30">{student.enrollment_id || student.program}</p>
                  </div>
                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: s }))}
                        title={STATUS_CONFIG[s].label}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                          status === s
                            ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`
                            : "border-white/[0.08] text-white/20 hover:text-white/50 hover:bg-white/5"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]" style={status === s ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {STATUS_CONFIG[s].icon}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Current label */}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border hidden sm:block ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}>
                    {STATUS_CONFIG[status].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSubmit}
        disabled={isSaving || students.length === 0}
        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
      >
        {isSaving ? (
          <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-[20px]">save</span>
        )}
        {isSaving ? "Saving…" : `Save Attendance for ${selectedDate}`}
      </button>
    </div>
  );
}
