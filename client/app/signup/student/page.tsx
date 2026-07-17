"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


// ── All logic below is unchanged from original. Only the UI wrapper was updated. ──

export default function StudentSignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        program: formData.get("department"),
        academic_background: formData.get("university"),
        course_interest: formData.get("interest"),
      };

      const response = await fetch(`/api/applicants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to submit application");

      toast.success("Application Submitted! Your profile has been received.");
      router.push("/");
    } catch (err) {
      toast.error("An error occurred while submitting your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    preventDefaults(e);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileName(`Selected: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(`Selected: ${e.target.files[0].name}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#090D16" }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[120px] animate-pulse-glow"
          style={{ background: "radial-gradient(circle, #F6B32B 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-[120px] animate-pulse-glow animation-delay-1000"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(246,179,43,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(246,179,43,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <main className="relative z-10 min-h-screen px-4 sm:px-8 md:px-16 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">

          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            aria-label="Go back"
            className={`flex items-center gap-2 text-gray-500 hover:text-yellow-400 transition-colors mb-8 group cursor-pointer bg-transparent border-none ${mounted ? "animate-fade-in" : "opacity-0"}`}
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform duration-200">
              arrow_back
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">Back to Home</span>
          </button>

          {/* Header */}
          <header className={`mb-10 ${mounted ? "animate-fade-in-up" : "opacity-0"}`}>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(246,179,43,0.35)]"
                style={{ background: "linear-gradient(135deg, #F6B32B 0%, #E09B18 100%)" }}
              >
                <span
                  className="material-symbols-outlined text-2xl text-black"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person_add
                </span>
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-yellow-400/70">Falcon Swift LMS</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">Student Application</h1>
              </div>
            </div>
            <p className="text-gray-400 font-light text-sm max-w-xl leading-relaxed">
              Submit your details to register and explore opportunities. Our program connects top academic talent with industry-leading education.
            </p>
          </header>

          {/* Form */}
          <form className="space-y-6" id="internshipForm" onSubmit={handleSubmit}>

            {/* ── Section 1: Personal Information ── */}
            <section
              className={`student-glass-panel student-glass-panel-accent rounded-2xl p-6 md:p-8 ${mounted ? "animate-fade-in-up animation-delay-100" : "opacity-0"}`}
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(246,179,43,0.1)", border: "1px solid rgba(246,179,43,0.2)" }}>
                  <span className="material-symbols-outlined text-yellow-400 text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">First Name *</label>
                  <input
                    name="firstName"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="Enter your first name"
                    required
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Last Name *</label>
                  <input
                    name="lastName"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="Enter your last name"
                    required
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Email Address *</label>
                  <input
                    name="email"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="yourname@university.edu"
                    required
                    type="email"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Phone Number (Pakistan) *</label>
                  <input
                    name="phone"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="+92 3XX XXXXXXX"
                    required
                    type="tel"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">CNIC Number *</label>
                  <input
                    name="cnic"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="e.g. 42101-XXXXXXX-X"
                    required
                    type="text"
                  />
                </div>
              </div>
            </section>

            {/* ── Section 2: Academic Information ── */}
            <section
              className={`student-glass-panel student-glass-panel-accent rounded-2xl p-6 md:p-8 ${mounted ? "animate-fade-in-up animation-delay-200" : "opacity-0"}`}
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(246,179,43,0.1)", border: "1px solid rgba(246,179,43,0.2)" }}>
                  <span className="material-symbols-outlined text-yellow-400 text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <h2 className="text-xl font-bold text-white">Academic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">University *</label>
                  <input
                    name="university"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="Full name of your institution"
                    required
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Department *</label>
                  <select
                    name="department"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all appearance-none cursor-pointer"
                    required
                    defaultValue=""
                  >
                    <option className="bg-[#101827] text-white" disabled value="">Select Department</option>
                    <option className="bg-[#101827] text-white" value="Computer Science">Computer Science</option>
                    <option className="bg-[#101827] text-white" value="Software Engineering">Software Engineering</option>
                    <option className="bg-[#101827] text-white" value="IT">IT</option>
                    <option className="bg-[#101827] text-white" value="AI">AI</option>
                    <option className="bg-[#101827] text-white" value="Data Science">Data Science</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Current Semester *</label>
                  <select
                    name="semester"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all appearance-none cursor-pointer"
                    required
                    defaultValue=""
                  >
                    <option className="bg-[#101827] text-white" disabled value="">Select Semester</option>
                    <option className="bg-[#101827] text-white" value="1">1st</option>
                    <option className="bg-[#101827] text-white" value="2">2nd</option>
                    <option className="bg-[#101827] text-white" value="3">3rd</option>
                    <option className="bg-[#101827] text-white" value="4">4th</option>
                    <option className="bg-[#101827] text-white" value="5">5th</option>
                    <option className="bg-[#101827] text-white" value="6">6th</option>
                    <option className="bg-[#101827] text-white" value="7">7th</option>
                    <option className="bg-[#101827] text-white" value="8">8th</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">University Registration Number *</label>
                  <input
                    name="regNumber"
                    className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all placeholder:text-gray-600"
                    placeholder="e.g. 2021-CS-123"
                    required
                    type="text"
                  />
                </div>
              </div>
            </section>

            {/* ── Section 3: Additional Information ── */}
            <section
              className={`student-glass-panel student-glass-panel-accent rounded-2xl p-6 md:p-8 ${mounted ? "animate-fade-in-up animation-delay-300" : "opacity-0"}`}
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(246,179,43,0.1)", border: "1px solid rgba(246,179,43,0.2)" }}>
                  <span className="material-symbols-outlined text-yellow-400 text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}>interests</span>
                </div>
                <h2 className="text-xl font-bold text-white">Additional Information</h2>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wider uppercase text-gray-400">Areas of Interest (Optional)</label>
                <textarea
                  name="interest"
                  className="bg-transparent border-0 border-b border-yellow-400/15 py-3 px-0 text-white student-input-glow transition-all resize-none placeholder:text-gray-600"
                  placeholder="Mention your technical skills, projects, or specific fields you want to work in..."
                  rows={4}
                />
              </div>
            </section>

            {/* ── Section 4: Upload CV ── */}
            <section
              className={`student-glass-panel student-glass-panel-accent rounded-2xl p-6 md:p-8 ${mounted ? "animate-fade-in-up animation-delay-400" : "opacity-0"}`}
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(246,179,43,0.1)", border: "1px solid rgba(246,179,43,0.2)" }}>
                  <span className="material-symbols-outlined text-yellow-400 text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                </div>
                <h2 className="text-xl font-bold text-white">Upload CV</h2>
              </div>

              <div
                className="relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 cursor-pointer text-center"
                style={{ borderColor: "rgba(246,179,43,0.2)" }}
                id="drop-zone"
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={handleDrop}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(246,179,43,0.5)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(246,179,43,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(246,179,43,0.2)";
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <input
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: "rgba(246,179,43,0.08)", border: "1px solid rgba(246,179,43,0.2)" }}
                  >
                    <span className="material-symbols-outlined text-yellow-400 text-3xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      upload_file
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base text-white font-semibold">
                      Drag &amp; drop your resume or{" "}
                      <span className="text-yellow-400 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>
                {fileName && (
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-black bg-yellow-400 py-2 px-4 rounded-full">
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    {fileName}
                  </div>
                )}
              </div>
            </section>

            {/* ── Action Buttons ── */}
            <div className={`flex flex-col md:flex-row items-center justify-end gap-4 pt-4 ${mounted ? "animate-fade-in-up animation-delay-500" : "opacity-0"}`}>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Go Back
              </button>
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full md:w-auto px-12 py-3.5 btn-gold rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    Submit Application
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}