"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

const COURSES = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer" },
  { id: "web-dev", label: "Web Development" },
  { id: "app-dev", label: "App Development" },
  { id: "devops", label: "DevOps" },
];

interface Trainer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  phone: string | null;
  avatar_url: string | null;
  email: string;
  assigned_courses: string[] | null;
  created_at: string;
}

export default function AdminTrainersPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers`);
      const json = await res.json();
      if (json.success) setTrainers(json.data || []);
    } catch { toast.error("Failed to load trainers."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    if (role !== "admin") { router.push("/"); return; }
    fetchTrainers();
  }, [fetchTrainers, router]);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      toast.error("First name, last name, and email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, department, assignedCourses: selectedCourses }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Trainer created! Employee ID: ${json.employeeId}`);
        setShowForm(false);
        setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setDepartment(""); setSelectedCourses([]);
        fetchTrainers();
      } else {
        toast.error(json.error || "Failed to create trainer.");
      }
    } catch { toast.error("Network error."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this trainer? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Trainer deleted."); fetchTrainers(); }
      else toast.error(json.error || "Failed to delete.");
    } catch { toast.error("Network error."); }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Trainer Management</h1>
          <p className="text-white/40 text-sm">{trainers.length} trainers enrolled</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "person_add"}</span>
          {showForm ? "Cancel" : "Add Trainer"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#101827] border border-[#F6B32B]/20 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-bold text-white mb-5">Create Trainer Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[
              { label: "First Name *", value: firstName, setter: setFirstName, placeholder: "John" },
              { label: "Last Name *", value: lastName, setter: setLastName, placeholder: "Doe" },
              { label: "Email *", value: email, setter: setEmail, placeholder: "trainer@example.com" },
              { label: "Phone", value: phone, setter: setPhone, placeholder: "+92 300 0000000" },
              { label: "Department", value: department, setter: setDepartment, placeholder: "Engineering" },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5 block">{label}</label>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Assigned Courses</label>
            <div className="flex gap-2 flex-wrap">
              {COURSES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleCourse(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedCourses.includes(c.id)
                      ? "bg-[#F6B32B]/15 border-[#F6B32B]/30 text-[#F6B32B]"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-400">A temporary password <strong>FalconSwift@123</strong> will be generated. The trainer will receive login credentials via email.</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <span className="material-symbols-outlined text-[18px]">person_add</span>}
            {isSubmitting ? "Creating…" : "Create Trainer"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
        </div>
      ) : trainers.length === 0 ? (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-14 text-center">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">badge</span>
          <p className="text-white/40 text-sm">No trainers yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-[#F6B32B] text-sm font-semibold hover:underline">Add your first trainer</button>
        </div>
      ) : (
        <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_2fr_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-white/30">
            <span>Trainer</span><span>Department</span><span>Employee ID</span><span>Courses</span><span>Action</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_2fr_auto] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E2A3B] flex items-center justify-center shrink-0 border border-white/[0.06] overflow-hidden">
                    {trainer.avatar_url ? (
                      <img src={trainer.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-white/50 font-bold">{(trainer.first_name || "?")[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{trainer.first_name} {trainer.last_name}</p>
                    <p className="text-[11px] text-white/30 truncate">{trainer.email}</p>
                  </div>
                </div>
                <span className="text-sm text-white/50">{trainer.department || "—"}</span>
                <span className="text-xs font-mono text-[#F6B32B]">{trainer.employee_id || "—"}</span>
                <div className="flex flex-wrap gap-1">
                  {(trainer.assigned_courses || []).slice(0, 3).map((c) => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">{c}</span>
                  ))}
                  {!trainer.assigned_courses?.length && <span className="text-white/25 text-xs">None assigned</span>}
                </div>
                <button
                  onClick={() => handleDelete(trainer.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
