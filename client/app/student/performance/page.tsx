"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


interface PerformanceRecord {
  assignment_id: number;
  task_name: string;
  course_label: string;
  max_points: number;
  score: number;
  grade: string;
  feedback: string | null;
  graded_at: string;
}

interface Summary {
  averageScore: number;
  totalGraded: number;
  highestScore: number;
  lowestScore: number;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400 bg-emerald-500/15",
  "A": "text-emerald-400 bg-emerald-500/10",
  "B": "text-blue-400 bg-blue-500/10",
  "C": "text-orange-400 bg-orange-500/10",
  "F": "text-red-400 bg-red-500/10",
  "Pending": "text-white/30 bg-white/5",
};

export default function StudentPerformancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  const fetchPerformance = useCallback(async (studentId: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/students/${studentId}/performance`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        setSummary(json.summary || null);
      }
    } catch { toast.error("Failed to load performance."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined") { router.push("/"); return; }
    try {
      const student = JSON.parse(infoStr);
      setStudentName(`${student.first_name} ${student.last_name}`);
      fetchPerformance(student.id);
    } catch { router.push("/"); }
  }, [router, fetchPerformance]);

  // Score bar chart
  const ScoreBar = ({ score, max }: { score: number; max: number }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-[#F6B32B]" : "bg-red-500"}`}
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white/60 w-12 text-right">{score}/{max}</span>
    </div>
  );

  const overallGrade =
    !summary?.averageScore ? "—"
    : summary.averageScore >= 90 ? "A+"
    : summary.averageScore >= 80 ? "A"
    : summary.averageScore >= 70 ? "B"
    : summary.averageScore >= 60 ? "C"
    : "F";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Performance</h1>
        <p className="text-white/40 text-sm">Track your grades, marks, and trainer feedback</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Average Score", value: `${summary?.averageScore ?? 0}%`, icon: "trending_up", color: "text-[#F6B32B]", bg: "bg-[#F6B32B]/10" },
          { label: "Overall Grade", value: overallGrade, icon: "grade", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Tasks Graded", value: summary?.totalGraded ?? 0, icon: "task_alt", color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Highest Score", value: `${summary?.highestScore ?? 0}%`, icon: "emoji_events", color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((card) => (
          <div key={card.label} className="bg-[#101827] border border-white/[0.06] rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Visual score overview */}
      {records.length > 0 && (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-white mb-5">Score Timeline</h2>
          <div className="flex items-end gap-3 h-24">
            {records.slice(0, 10).map((r, i) => {
              const h = Math.max(Math.round((r.score / (r.max_points || 100)) * 100), 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${r.task_name}: ${r.score}/${r.max_points}`}>
                  <span className="text-[10px] text-white/40">{r.score}</span>
                  <div
                    className={`w-full rounded-t-md ${r.score >= 80 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : r.score >= 60 ? "bg-gradient-to-t from-[#E09B18] to-[#F6B32B]" : "bg-gradient-to-t from-red-700 to-red-500"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-white/25 text-center leading-tight max-w-[40px] truncate">{r.course_label || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed table */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">Assignment Breakdown</h2>
        </div>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">school</span>
            <p className="text-white/40 text-sm">No graded tasks yet</p>
            <p className="text-white/25 text-xs mt-1">Submit your tasks to see your performance here</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
              <span>Task</span><span>Course</span><span>Grade</span><span>Score</span><span>Feedback</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {records.map((record) => (
                <div key={record.assignment_id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                  <div>
                    <p className="text-sm font-semibold text-white">{record.task_name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{record.graded_at ? new Date(record.graded_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <span className="text-xs text-[#F6B32B] font-semibold">{record.course_label || "—"}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${GRADE_COLORS[record.grade] || "text-white/30 bg-white/5"}`}>{record.grade}</span>
                  <ScoreBar score={record.score} max={record.max_points || 100} />
                  <p className="text-xs text-white/40 line-clamp-2">{record.feedback || <span className="italic text-white/20">No feedback provided</span>}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
