"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


interface Student {
  id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  total_tasks?: number;
  graded_tasks?: number;
  avg_score?: number;
}

const PROGRAM_LABELS: Record<string, string> = {
  "fullstack-ai": "Full Stack AI",
  "devops": "DevOps",
  "app-dev": "App Dev",
  "web-dev": "Web Dev",
};

export default function TrainerStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/full-report`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
        setFiltered(json.data || []);
      } else {
        // Fallback to basic list
        const fallback = await fetch(`/api/students`);
        const fj = await fallback.json();
        if (fj.success) { setStudents(fj.data || []); setFiltered(fj.data || []); }
      }
    } catch {
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    fetchStudents();
  }, [fetchStudents, router]);

  useEffect(() => {
    let data = [...students];
    if (programFilter !== "all") data = data.filter((s) => s.program === programFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.enrollment_id || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [search, programFilter, students]);

  const programs = Array.from(new Set(students.map((s) => s.program).filter(Boolean)));

  const getGradeColor = (score?: number) => {
    if (!score) return "text-white/30";
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-[#F6B32B]";
    return "text-red-400";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Students</h1>
        <p className="text-white/40 text-sm">{students.length} enrolled students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/30 text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
          />
        </div>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#F6B32B]/40"
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{PROGRAM_LABELS[p] || p}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">group</span>
          <p className="text-white/40 text-sm">No students found</p>
        </div>
      ) : (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
            <span>Student</span>
            <span>Program</span>
            <span>Tasks</span>
            <span>Avg Score</span>
            <span>Contact</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((student) => (
              <div key={student.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 border border-white/[0.06] overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-white/50 font-bold">{(student.first_name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{student.first_name} {student.last_name}</p>
                    <p className="text-[11px] text-white/30 truncate">{student.enrollment_id}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F6B32B]/10 text-[#F6B32B]">
                    {PROGRAM_LABELS[student.program] || student.program || "—"}
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  <span className="font-bold text-white">{student.graded_tasks ?? "—"}</span>
                  {student.total_tasks != null && <span className="text-white/30"> / {student.total_tasks}</span>}
                </div>
                <div>
                  <span className={`text-sm font-bold ${getGradeColor(student.avg_score)}`}>
                    {student.avg_score != null ? `${student.avg_score}%` : "—"}
                  </span>
                </div>
                <div>
                  {student.email && (
                    <a href={`mailto:${student.email}`} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      <span className="truncate max-w-[120px]">{student.email}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
