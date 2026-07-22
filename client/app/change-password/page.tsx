"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Password changed successfully! Redirecting...");
        localStorage.removeItem("lms_must_change_password");
        // Redirect to the dashboard corresponding to their role
        const role = localStorage.getItem("lms_user_role");
        setTimeout(() => {
          if (role === "student") router.push("/student/dashboard");
          else if (role === "trainer") router.push("/trainer/dashboard");
          else router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .glass-panel {
          background: rgba(20, 33, 61, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .input-glow:focus {
          border-color: rgba(246, 179, 43, 0.5);
          box-shadow: 0 0 15px rgba(246, 179, 43, 0.15);
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />

      {/* Decorative Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F6B32B] opacity-[0.03] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#206393] opacity-[0.05] blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className={`glass-panel w-full max-w-md rounded-3xl p-8 relative z-10 ${mounted ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#F6B32B]/10 border border-[#F6B32B]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F6B32B] text-3xl">lock_reset</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Change Required</h1>
        <p className="text-gray-400 text-sm text-center mb-8 font-light">
          For your security, please update your temporary password before accessing the portal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="e.g. Password@123"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none input-glow transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none input-glow transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#F6B32B] to-[#f7c04a] text-black font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(246,179,43,0.3)] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
