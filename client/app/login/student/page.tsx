"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ── Auth Logic (reuses existing /api/auth/login endpoint) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      toast.warning("Please fill in all credential fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiClient(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Invalid student ID or password.");
      } else {
        localStorage.setItem("lms_auth", "true");
        if (json.token) localStorage.setItem("lms_token", json.token);
        localStorage.setItem("lms_user_role", json.user.role);
        localStorage.setItem("lms_user_id", String(json.user.id));

        if (json.user.role === "student") {
          if (json.user.student) {
            localStorage.setItem("lms_student_info", JSON.stringify(json.user.student));
          }
          if (json.user.mustChangePassword) {
            localStorage.setItem("lms_must_change_password", "true");
            toast.error("Please update your default password first.");
            router.push("/change-password");
          } else {
            toast.success("Login successful. Welcome to your Student Portal!");
            router.push("/student/dashboard");
          }
        } else if (json.user.role === "trainer") {
          toast.success("Login successful. Welcome to Trainer Portal!");
          router.push("/trainer/dashboard");
        } else {
          // Staff/admin logged in via student portal — redirect appropriately
          toast.success("Login successful. Welcome back, Administrator!");
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Could not connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 md:p-8"
      style={{ background: "#090D16" }}
    >
      {/* ── Atmospheric Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Blue blob top-right */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[100px] animate-pulse-glow"
          style={{
            background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
            transform: `translate(${-parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Blue blob bottom-left */}
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[100px] animate-pulse-glow animation-delay-1000"
          style={{
            background: "radial-gradient(circle, #1D4ED8 0%, transparent 70%)",
            transform: `translate(${parallax.x * 0.4}px, ${-parallax.y * 0.4}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Login Card ── */}
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl p-8 md:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] ${mounted ? "animate-fade-in-up" : "opacity-0"}`}
        style={{
          background: "rgba(16, 24, 39, 0.75)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(59, 130, 246, 0.15)",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          aria-label="Go back to home"
          className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition-colors duration-200 mb-8 group cursor-pointer bg-transparent border-none"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform duration-200">
            arrow_back
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-[0_0_28px_rgba(59,130,246,0.4)]"
            style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)" }}
          >
            <span
              className="material-symbols-outlined text-3xl text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-blue-400/80 mb-2">
            Falcon Swift
          </p>
          <h1 className="text-2xl font-extrabold text-white mb-2">Student Portal</h1>
          <p className="text-gray-500 text-sm font-light">
            Sign in with your student credentials.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Student ID / Email */}
          <div>
            <label
              htmlFor="student-email"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Student ID or Email
            </label>
            <div className="relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors text-lg pointer-events-none"
              >
                person
              </span>
              <input
                id="student-email"
                type="text"
                autoComplete="username"
                placeholder="student@falconswift.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input"
                style={{ paddingLeft: "3rem", borderColor: "rgba(59,130,246,0.15)" }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="student-password"
                className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info("Please contact your instructor for password recovery.")
                }
                className="text-xs text-blue-400 font-semibold hover:underline transition-all cursor-pointer bg-transparent border-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors text-lg pointer-events-none"
              >
                lock
              </span>
              <input
                id="student-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input pr-12"
                style={{ paddingLeft: "3rem", borderColor: "rgba(59,130,246,0.15)" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="student-login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-blue rounded-xl py-4 text-sm font-bold tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  login
                </span>
                Sign In to Portal
              </span>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            New student?{" "}
            <button
              onClick={() => router.push("/apply")}
              className="text-blue-400 font-semibold hover:underline cursor-pointer bg-transparent border-none"
            >
              Register your account
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-6 font-light">
          © {new Date().getFullYear()} Falcon Swift LMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
