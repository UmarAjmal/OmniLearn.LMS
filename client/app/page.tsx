"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const stats = [
    { icon: "verified", label: "99.99% Uptime", delay: "animation-delay-200" },
    { icon: "support_agent", label: "24/7 Support", delay: "animation-delay-300" },
    { icon: "cloud_done", label: "Secure Cloud Infrastructure", delay: "animation-delay-400" },
    { icon: "psychology", label: "Smart Learning Experience", delay: "animation-delay-500" },
  ];

  const cards = [
    { icon: "school", label: "Learn Anywhere", sub: "Access courses from any device", delay: "animation-delay-300" },
    { icon: "menu_book", label: "Build Your Future", sub: "Expert-led curriculum", delay: "animation-delay-400" },
    { icon: "rocket_launch", label: "Unlock Your Potential", sub: "Skill-based progression", delay: "animation-delay-500" },
    { icon: "public", label: "Modern Digital Education", sub: "Next-gen LMS platform", delay: "animation-delay-600" },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 md:p-8"
      style={{ background: "#090D16" }}
    >
      {/* ── Atmospheric Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Large gold blob top-left */}
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.07] blur-[120px] animate-pulse-glow"
          style={{
            background: "radial-gradient(circle, #F6B32B 0%, transparent 70%)",
            transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Blue blob bottom-right */}
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[120px] animate-pulse-glow animation-delay-1000"
          style={{
            background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
            transform: `translate(${-parallax.x * 0.4}px, ${-parallax.y * 0.4}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(246,179,43,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(246,179,43,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Main Container ── */}
      <div
        ref={heroRef}
        className="relative z-10 w-full max-w-[1200px] grid lg:grid-cols-2 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={{
          background: "rgba(16, 24, 39, 0.55)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* ══════════════════════════════
            LEFT PANEL — Branding
            ══════════════════════════════ */}
        <div className="relative p-8 md:p-12 flex flex-col justify-between overflow-hidden min-h-[520px]">
          {/* Floating decorative shapes */}
          <div
            className="absolute top-12 right-10 w-48 h-48 rounded-full border border-yellow-400/10 animate-spin-slow pointer-events-none"
            style={{ transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px)`, transition: "transform 0.5s ease-out" }}
          />
          <div
            className="absolute bottom-20 left-8 w-28 h-28 rounded-full border border-blue-500/10 animate-float pointer-events-none"
          />
          <div
            className="absolute top-1/2 right-4 w-16 h-16 rounded-xl border border-yellow-400/8 rotate-45 animate-float-reverse pointer-events-none"
          />
          {/* Gold glow orb */}
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full blur-[80px] opacity-10 animate-pulse-glow pointer-events-none"
            style={{ background: "radial-gradient(circle, #F6B32B, transparent)" }} />

          {/* Logo + Brand */}
          <div className={`relative z-10 ${mounted ? "animate-slide-in-left" : "opacity-0"}`}>
            <div className="flex items-center gap-4 mb-8">
              {/* Falcon Swift Logo */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(246,179,43,0.4)]"
                  style={{ background: "linear-gradient(135deg, #F6B32B 0%, #E09B18 100%)" }}>
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill="rgba(0,0,0,0.2)" />
                    <path d="M8 12 Q16 6 24 12 L20 16 Q16 10 12 16 Z" fill="#000" opacity="0.85"/>
                    <path d="M10 18 L16 14 L22 18 L16 26 Z" fill="#000" opacity="0.75"/>
                    <circle cx="16" cy="13" r="2.5" fill="#000" opacity="0.9"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-yellow-400/70 mb-0.5">Falcon Swift</p>
                <p className="text-sm text-gray-400 font-light">Learning Management System</p>
              </div>
            </div>

            {/* Hero Heading */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
              Empowering Education
              <br />
              <span style={{
                background: "linear-gradient(135deg, #F6B32B 0%, #FFD97D 50%, #F6B32B 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 3s linear infinite",
              }}>
                Through Innovation
              </span>
            </h1>
            <p className="text-gray-400 font-light leading-relaxed text-sm max-w-sm mb-8">
              Falcon Swift LMS provides secure, intelligent and modern education management for students, teachers and administrators.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${mounted ? `animate-fade-in-up ${stat.delay}` : "opacity-0"}`}
                  style={{
                    background: "rgba(246, 179, 43, 0.06)",
                    border: "1px solid rgba(246, 179, 43, 0.12)",
                  }}
                >
                  <span className="material-symbols-outlined text-yellow-400 text-base flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {stat.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-300">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Cards */}
          <div className={`relative z-10 grid grid-cols-2 gap-3 ${mounted ? "animate-fade-in-up animation-delay-600" : "opacity-0"}`}>
            {cards.map((card) => (
              <div
                key={card.label}
                className="glass-panel-card rounded-xl p-3 cursor-default group"
              >
                <span className="material-symbols-outlined text-yellow-400 text-lg mb-1.5 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
                <p className="text-white font-semibold text-xs leading-tight">{card.label}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 font-light">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT PANEL — Role Selection
            ══════════════════════════════ */}
        <div
          className="flex flex-col justify-center p-8 md:p-12"
          style={{
            background: "rgba(9, 13, 22, 0.6)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className={`w-full max-w-sm mx-auto ${mounted ? "animate-slide-in-right" : "opacity-0"}`}>

            {/* Header */}
            <div className="text-center mb-10">
              {/* Logo icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-[0_0_28px_rgba(246,179,43,0.35)]"
                style={{ background: "linear-gradient(135deg, #F6B32B 0%, #E09B18 100%)" }}>
                <span className="material-symbols-outlined text-3xl text-black"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>

              <p className="text-xs font-bold tracking-[0.25em] uppercase text-yellow-400/80 mb-2">Falcon Swift</p>
              <h2 className="text-3xl font-extrabold text-white mb-3">Welcome Back</h2>
              <p className="text-gray-500 text-sm font-light">
                Access your learning dashboard securely.
              </p>
            </div>

            {/* Role Buttons */}
            <div className="space-y-4">

              {/* Staff / Admin Button */}
              <button
                id="btn-staff-login"
                aria-label="Login as Staff or Admin"
                onClick={() => router.push("/login/staff")}
                className="w-full btn-gold rounded-2xl py-4 px-6 flex items-center gap-4 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-black text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    admin_panel_settings
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-black text-sm">Login as Staff / Admin</p>
                  <p className="text-black/60 text-xs font-medium mt-0.5">Teachers, Admins &amp; Staff</p>
                </div>
                <span className="material-symbols-outlined text-black/50 text-lg group-hover:translate-x-1 transition-transform duration-300">
                  arrow_forward
                </span>
              </button>

              {/* Student Login Button */}
              <button
                id="btn-student-login"
                aria-label="Login as Student"
                onClick={() => router.push("/login/student")}
                className="w-full btn-blue rounded-2xl py-4 px-6 flex items-center gap-4 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-white text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    person
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Login as Student</p>
                  <p className="text-white/50 text-xs font-medium mt-0.5">Students Portal</p>
                </div>
                <span className="material-symbols-outlined text-white/50 text-lg group-hover:translate-x-1 transition-transform duration-300">
                  arrow_forward
                </span>
              </button>

              {/* Register Button */}
              <button
                id="btn-student-register"
                aria-label="Register as New Student"
                onClick={() => router.push("/signup/student")}
                className="w-full btn-outline rounded-2xl py-4 px-6 flex items-center gap-4 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "rgba(246,179,43,0.08)", border: "1px solid rgba(246,179,43,0.2)" }}>
                  <span className="material-symbols-outlined text-yellow-400 text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    person_add
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Register as New Student</p>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">Create your Student Account</p>
                </div>
                <span className="material-symbols-outlined text-gray-600 text-lg group-hover:translate-x-1 transition-transform duration-300">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-gray-600 text-xs mt-8 font-light">
              © {new Date().getFullYear()} Falcon Swift LMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
