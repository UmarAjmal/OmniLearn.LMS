"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DragDropUploader from "@/components/DragDropUploader";


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
  
  // Compulsory Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnic, setCnic] = useState("");
  const [university, setUniversity] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [program, setProgram] = useState("fullstack-ai");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Computer Science Social Handles
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const [enrollmentId, setEnrollmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/profile?userId=${uid}`);
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
        setLinkedinUrl(d.linkedin_url || "");
        setGithubUrl(d.github_url || "");
        setPortfolioUrl(d.portfolio_url || "");
        setResumeUrl(d.resume_url || "");
        setEnrollmentId(d.enrollment_id || "");

        // Synchronize local storage to resolve warning banners immediately
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
    const handleLogout = () => {
      localStorage.removeItem("lms_auth");
      localStorage.removeItem("lms_user_role");
      localStorage.removeItem("lms_user_id");
      localStorage.removeItem("lms_student_info");
      router.push("/");
    };

    if (!uid) {
      toast.error("User session details missing. Please re-login.");
      handleLogout();
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
      const res = await fetch(`/api/students/profile`, {
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
          avatarUrl: avatarUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          githubUrl: githubUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
          resumeUrl: resumeUrl.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to update profile.");
      } else {
        toast.success("🎉 Profile completed and updated successfully!");
        localStorage.setItem("lms_student_info", JSON.stringify(json.data));
        // Force reload page to update warning banner in Navigation
        window.location.reload();
      }
    } catch {
      toast.error("Network error during update.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to change password.");
      } else {
        toast.success("🔑 Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Network error during password change.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  const inputCls = "w-full bg-[#0a1426]/60 border border-white/10 rounded-lg p-3 text-white text-xs font-semibold focus:outline-none focus:border-primary/50 transition-colors placeholder-white/20";
  const disabledInputCls = "w-full bg-white/5 border border-white/5 rounded-lg p-3 text-white/50 text-xs font-semibold cursor-not-allowed";

  return (
    <div className="relative text-xs font-sans text-white/90 max-w-3xl mx-auto space-y-6">
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
        <p className="text-on-surface-variant font-light mt-1 text-xs">
          Provide your compulsory verification details and professional links to register your student profile.
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
              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Assigned Enrollment ID</p>
                  <p className="text-xs font-extrabold text-white mt-0.5">{enrollmentId}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              </div>
            )}

            <div className="border-b border-white/5 pb-2">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Verification details</h3>
            </div>

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
                <FieldLabel required>WhatsApp Number</FieldLabel>
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

            <div className="border-b border-white/5 pb-2 pt-2">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Professional Handles</h3>
            </div>

            {/* LinkedIn & GitHub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>LinkedIn Profile URL</FieldLabel>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>GitHub Profile URL</FieldLabel>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Portfolio & Resume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Portfolio Website URL</FieldLabel>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://username.dev"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>Resume / CV Link</FieldLabel>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={e => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Enrolled Program (Read Only) & DP Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <FieldLabel>Enrolled Program Track</FieldLabel>
                  <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest">Admin Locked</span>
                </div>
                <select
                  value={program}
                  disabled
                  className={disabledInputCls}
                >
                  {TRACKS.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0b132b]">{t.label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-on-surface-variant/45 mt-1 font-light italic">
                  * Program track transfers can only be processed by LMS Administrators.
                </p>
              </div>
              <div>
                <FieldLabel>Display Picture (DP) Image</FieldLabel>
                {avatarUrl ? (
                  <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                    <img src={avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">Avatar Uploaded</p>
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider mt-1 block"
                      >
                        Remove &amp; Upload Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <DragDropUploader
                    onUploadSuccess={(url) => setAvatarUrl(url)}
                    label="Drag &amp; Drop DP or Click to Browse"
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 text-black py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_8px_24px_-4px_rgba(252,163,17,0.3)] cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Saving profile details...</>
              ) : (
                <><span className="material-symbols-outlined text-[17px]">save</span> Save &amp; Complete Onboarding Profile</>
              )}
            </button>

          </form>

        </div>
      )}

      {/* Password Change Section */}
      {!isLoading && (
        <div className="glacier-card p-6 rounded-2xl mt-6">
          <div className="border-b border-white/5 pb-2 mb-5">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Account Security
            </h3>
            <p className="text-on-surface-variant font-light mt-1 text-[10px]">
              If you logged in with a temporary password, please change it immediately.
            </p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel required>Current Password</FieldLabel>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <FieldLabel required>New Password</FieldLabel>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <FieldLabel required>Confirm New Password</FieldLabel>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-[#1a2b4c] hover:bg-[#20365d] border border-[#2a4374] disabled:opacity-50 text-white py-3 px-6 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Updating...</>
                ) : (
                  <><span className="material-symbols-outlined text-[15px]">key</span> Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
