"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

const TRACKS = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer" },
  { id: "devops", label: "DevOps" },
  { id: "app-dev", label: "App Development" },
  { id: "web-dev", label: "Web Development" }
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnic, setCnic] = useState("");
  const [university, setUniversity] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [program, setProgram] = useState("fullstack-ai");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/profile?userId=${uid}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFirstName(d.first_name || "");
        setLastName(d.last_name || "");
        setWhatsapp(d.whatsapp || "");
        setCnic(d.cnic || "");
        setUniversity(d.university || "");
        setSemester(d.semester ? String(d.semester) : "");
        setProgram(d.program || "fullstack-ai");
        setAvatarUrl(d.avatar_url || "");
        setEnrollmentId(d.enrollment_id || "");

        // Keep local storage synchronized
        localStorage.setItem("lms_student_info", JSON.stringify(d));
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      toast.error("Could not fetch profile from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem("lms_user_id");
    if (!uid) {
      toast.error("User session missing.");
      router.push("/");
      return;
    }
    setUserId(uid);
    fetchProfile(uid);
  }, [router, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !whatsapp.trim() || !cnic.trim() || !university.trim() || !semester) {
      toast.error("All compulsory profile fields (*) must be provided.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          whatsapp: whatsapp.trim(),
          cnic: cnic.trim(),
          university: university.trim(),
          semester: Number(semester),
          program,
          avatarUrl: avatarUrl.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update profile.");
      } else {
        toast.success("🎉 Profile completed and updated successfully!");
        localStorage.setItem("lms_student_info", JSON.stringify(json.data));
        // Force refresh page to update warning banner in Navigation
        window.location.reload();
      }
    } catch {
      toast.error("Network error during update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const inputCls = "w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white text-xs font-semibold focus:outline-none focus:border-primary/50 transition-colors placeholder-white/20";

  return (
    <div className="relative text-xs font-sans text-white/90 max-w-2xl mx-auto space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
      `}} />

      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Onboarding Profile Builder</h2>
        <p className="text-on-surface-variant font-light mt-1">
          Provide your compulsory verification details to register your student profile permanently.
        </p>
      </div>

      {isLoading ? (
        <div className="glacier-card p-16 rounded-2xl text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-xs">Loading profile parameters...</p>
        </div>
      ) : (
        <div className="glacier-card p-6 rounded-2xl">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Enrollment info (read only) */}
            {enrollmentId && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Assigned Enrollment ID</p>
                  <p className="text-xs font-extrabold text-white mt-0.5">{enrollmentId}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Muhammad"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <FieldLabel required>Last Name</FieldLabel>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Umar"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* WhatsApp & CNIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>WhatsApp / Phone Number</FieldLabel>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <FieldLabel required>CNIC (National ID)</FieldLabel>
                <input
                  type="text"
                  value={cnic}
                  onChange={e => setCnic(e.target.value)}
                  placeholder="e.g. 3610212345678"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* University / Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel required>University / Academic Institution</FieldLabel>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  placeholder="e.g. FAST NUCES, Lahore"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <FieldLabel required>Current Semester</FieldLabel>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                  required
                >
                  <option value="" className="bg-[#0b132b]">Select...</option>
                  {SEMESTERS.map(s => (
                    <option key={s} value={s} className="bg-[#0b132b]">{s} Semester</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Track & Avatar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Enrolled Program Track</FieldLabel>
                <select
                  value={program}
                  onChange={e => setProgram(e.target.value)}
                  className="w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 text-xs font-semibold"
                  required
                >
                  {TRACKS.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0b132b]">{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Profile Avatar Image URL</FieldLabel>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://imgur.com/image.png"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 text-black py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_8px_24px_-4px_rgba(252,163,17,0.3)] cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Saving Profile...</>
              ) : (
                <><span className="material-symbols-outlined text-[17px]">save</span> Save &amp; Finalize Profile</>
              )}
            </button>

          </form>

        </div>
      )}
    </div>
  );
}
