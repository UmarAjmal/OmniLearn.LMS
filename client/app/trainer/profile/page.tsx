"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


export default function TrainerProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trainers/profile?userId=${uid}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setFirstName(d.first_name || "");
        setLastName(d.last_name || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setDepartment(d.department || "");
        setEmployeeId(d.employee_id || "");
        setAvatarUrl(d.avatar_url || "");
      }
    } catch { toast.error("Failed to load profile."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    const uid = localStorage.getItem("lms_user_id");
    if (role !== "trainer" && role !== "admin") { router.push("/"); return; }
    if (uid) { setUserId(uid); fetchProfile(uid); }
  }, [fetchProfile, router]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/trainers/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone, avatarUrl }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(json.error || "Update failed.");
      }
    } catch { toast.error("Network error."); }
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields."); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match."); return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters."); return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast.error(json.error || "Password change failed.");
      }
    } catch { toast.error("Network error."); }
    finally { setIsChangingPassword(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-white/40 text-sm">Manage your trainer account information</p>
      </div>

      {/* Avatar + basic info */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-5">Profile Info</h2>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-[#1E2A3B] border-2 border-[#F6B32B]/20 overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <span className="material-symbols-outlined text-[#F6B32B] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white">{firstName} {lastName}</p>
            <p className="text-sm text-white/40">{email}</p>
            <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 uppercase tracking-wide">Trainer</span>
          </div>
        </div>
        <div className="space-y-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 block">Employee ID</label>
              <div className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-white/40">{employeeId || "—"}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 block">Department</label>
              <div className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-white/40">{department || "—"}</div>
            </div>
          </div>
          {/* Editable fields */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 0000000"
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <span className="material-symbols-outlined text-[18px]">save</span>}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-5">Change Password</h2>
        <div className="space-y-4">
          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
            { label: "New Password", value: newPassword, setter: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F6B32B]/40"
              />
            </div>
          ))}
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/[0.08]"
          >
            {isChangingPassword ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <span className="material-symbols-outlined text-[18px]">lock</span>}
            {isChangingPassword ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
