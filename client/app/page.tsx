"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parallax coordinates state
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Handle cursor mouse-move parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setParallax({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle login verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      toast.warning("Please fill in all credential fields.");
      setIsSubmitting(false);
      return;
    }

    // Offline Admin Fallback
    const isOfflineAdmin = (email === "admin" || email === "admin@enterprise.com") && password === "admin123";
    if (isOfflineAdmin) {
      localStorage.setItem("lms_auth", "true");
      localStorage.setItem("lms_user_role", "admin");
      toast.success("Welcome back, Senior Administrator!");
      router.push("/dashboard");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Invalid username or password.");
      } else {
        localStorage.setItem("lms_auth", "true");
        localStorage.setItem("lms_user_role", json.user.role);
        localStorage.setItem("lms_user_id", String(json.user.id));
        
        if (json.user.role === "student") {
          if (json.user.student) {
            localStorage.setItem("lms_student_info", JSON.stringify(json.user.student));
          }
          toast.success("Login successful. Welcome to Student Portal!");
          router.push("/student/dashboard");
        } else {
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

  const handleMockSSO = (provider: string) => {
    toast.info(`Executive SSO authentication with ${provider} launched in mock environment.`);
  };

  return (
    <div className="bg-[#000000] relative overflow-hidden min-h-screen flex items-center justify-center p-6 md:p-16">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating Shape 1 */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[90px] transition-transform duration-300 ease-out"
          style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
        />
        {/* Floating Shape 2 */}
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[650px] h-[650px] rounded-full bg-navy-accent/35 blur-[95px] transition-transform duration-300 ease-out"
          style={{ transform: `translate(${-parallax.x}px, ${-parallax.y}px)` }}
        />
        {/* Radial center overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-radial from-navy-accent/15 to-transparent opacity-60" />
      </div>

      {/* Centered Login Container */}
      <div className="relative z-10 w-full max-w-[1100px] grid md:grid-cols-2 bg-[#14213D]/25 backdrop-blur-[25px] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/80">
        {/* Visual Side Banner (Hidden on Mobile) */}
        <div className="hidden md:block relative overflow-hidden group">
          <img
            alt="Lumina Elite Entrance"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuJnOr974T3BpLntZlyP7p98NZNQq18hdAt3pBpsI_5tpHL4oXJDDX6uN-sK6SgMOYRyXI9ApaPxfAVVkpxE4VPTzf59kDn-B9uTzTnRhbIVpkY6k6hK9le45LStxtb9RrvoDMeaGrK6cFW7wQE2U60kXv7xARiJlKe5AaClBEU6Re1h7oGvreoV38F2vtNDUTNtqS53gsnyYabY075VzuBQAsyNZ2WanbPYUhqatPMU9AyaweVIm5Bh_FoyLV9DtUBZ0TcCtuxi9A"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#000000]/90 via-[#000000]/40 to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12">
            <h1 className="font-headline font-bold text-4xl text-white mb-3">Lumina Elite</h1>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed max-w-md">
              The pinnacle of professional academic excellence and executive learning management.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex flex-col justify-center p-8 md:p-14 bg-[#000000]/45 backdrop-blur-md">
          <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-black font-bold font-fill">
                    school
                  </span>
                </div>
                <span className="text-xl font-headline font-bold text-primary tracking-tight">Lumina Elite</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-white mb-1.5">Welcome Back</h2>
              <p className="text-xs text-on-surface-variant font-light">Access your executive dashboard.</p>
            </div>

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 ml-4">
                  Corporate Email
                </label>
                <div className="relative group transition-all">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-lg">
                    mail
                  </span>
                  <input
                    className="w-full bg-[#14213D]/40 border border-white/10 text-white text-sm py-3.5 pl-12 pr-4 rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/20"
                    placeholder="name@enterprise.com or admin"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 px-4">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info("Please contact administrative support for account recoveries.")}
                    className="text-xs text-primary font-semibold hover:underline transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group transition-all">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-lg">
                    lock
                  </span>
                  <input
                    className="w-full bg-[#14213D]/40 border border-white/10 text-white text-sm py-3.5 pl-12 pr-12 rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/20"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors cursor-pointer select-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-black font-semibold text-base rounded-full shadow-[0_10px_35px_rgba(252,163,17,0.3)] hover:shadow-[0_15px_45px_rgba(252,163,17,0.5)] active:scale-95 transition-all duration-300 cursor-pointer text-center"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-4 bg-transparent text-white/40 text-xs font-semibold uppercase tracking-wider backdrop-blur-xl">
                Or continue with
              </span>
            </div>

            {/* SSO Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleMockSSO("Google")}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-white/10 hover:bg-white/5 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-xs font-semibold text-white/70 group-hover:text-primary transition-colors">
                  Google
                </span>
              </button>
              <button
                onClick={() => handleMockSSO("Microsoft")}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-white/10 hover:bg-white/5 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M0 0h11.2v11.2H0V0z" fill="#00A4EF" />
                  <path d="M12.8 0H24v11.2H12.8V0z" fill="#7FBA00" />
                  <path d="M0 12.8h11.2V24H0V12.8z" fill="#F25022" />
                  <path d="M12.8 12.8H24V24H12.8V12.8z" fill="#FFB900" />
                </svg>
                <span className="text-xs font-semibold text-white/70 group-hover:text-primary transition-colors">
                  Microsoft
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-on-surface-variant font-light space-y-4">
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => toast.info("Please contact administrative executive support for dynamic logins.")}
                  className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Contact Admin
                </button>
              </p>
              <p>
                Are you a student?{" "}
                <button
                  onClick={() => router.push("/signup/student")}
                  className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer text-sm tracking-wider"
                >
                  Sign Up as Student
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
