"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function StudentSignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

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
        program: formData.get("department"), // Storing department as program for now
        academic_background: formData.get("university"),
        course_interest: formData.get("interest")
      };

      const response = await fetch("http://localhost:5000/api/applicants", {
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
    <div className="relative min-h-screen">
      <style dangerouslySetInnerHTML={{__html: `
        .student-glass-panel {
            background: rgba(20, 33, 61, 0.7);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 200, 135, 0.1);
            box-shadow: 0 25px 50px -12px rgba(1, 13, 41, 0.5);
        }
        .student-glass-panel-accent {
            border-top: 1px solid rgba(255, 200, 135, 0.3);
            border-left: 1px solid rgba(255, 200, 135, 0.3);
        }
        .student-input-glow:focus {
            outline: none;
            border-bottom: 2px solid #FCA311;
            box-shadow: 0 4px 12px -2px rgba(252, 163, 17, 0.2);
        }
      `}} />
      <main className="min-h-screen pt-24 lg:pt-0 px-5 md:px-16 pb-24 flex justify-center items-center">
        <div className="max-w-4xl w-full mx-auto lg:py-16">
          {/* Header Section */}
          <header className="mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Application Form</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl font-light">
              Submit your details and CV to explore exciting career opportunities with Internships. Our elite program connects top academic talent with industry leaders.
            </p>
          </header>

          {/* Application Form */}
          <form className="space-y-8" id="internshipForm" onSubmit={handleSubmit}>
            {/* Section 1: Personal Information */}
            <section className="student-glass-panel student-glass-panel-accent p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">First Name*</label>
                  <input name="firstName" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="Enter your first name" required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Last Name*</label>
                  <input name="lastName" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="Enter your last name" required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Email Address*</label>
                  <input name="email" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="alexander.vance@university.edu" required type="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Phone Number (Pakistan)*</label>
                  <input name="phone" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="+92 3XX XXXXXXX" required type="tel" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">CNIC Number*</label>
                  <input name="cnic" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="e.g. 42101-XXXXXXX-X" required type="text" />
                </div>
              </div>
            </section>

            {/* Section 2: Academic Information */}
            <section className="student-glass-panel student-glass-panel-accent p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">school</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Academic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">University*</label>
                  <input name="university" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="Full name of your institution" required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Department*</label>
                  <select name="department" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all appearance-none cursor-pointer" required defaultValue="">
                    <option className="bg-[#14213D] text-white" disabled value="">Select Department</option>
                    <option className="bg-[#14213D] text-white" value="Computer Science">Computer Science</option>
                    <option className="bg-[#14213D] text-white" value="Software Engineering">Software Engineering</option>
                    <option className="bg-[#14213D] text-white" value="IT">IT</option>
                    <option className="bg-[#14213D] text-white" value="AI">AI</option>
                    <option className="bg-[#14213D] text-white" value="Data Science">Data Science</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Current Semester*</label>
                  <select name="semester" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all appearance-none cursor-pointer" required defaultValue="">
                    <option className="bg-[#14213D] text-white" disabled value="">Select Semester</option>
                    <option className="bg-[#14213D] text-white" value="1">1st</option>
                    <option className="bg-[#14213D] text-white" value="2">2nd</option>
                    <option className="bg-[#14213D] text-white" value="3">3rd</option>
                    <option className="bg-[#14213D] text-white" value="4">4th</option>
                    <option className="bg-[#14213D] text-white" value="5">5th</option>
                    <option className="bg-[#14213D] text-white" value="6">6th</option>
                    <option className="bg-[#14213D] text-white" value="7">7th</option>
                    <option className="bg-[#14213D] text-white" value="8">8th</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">University Registration Number*</label>
                  <input name="regNumber" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all" placeholder="e.g. 2021-CS-123" required type="text" />
                </div>
              </div>
            </section>

            {/* Section 3: Additional Information */}
            <section className="student-glass-panel student-glass-panel-accent p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">interests</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Additional Information</h3>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wider uppercase text-on-surface-variant">Areas of Interest (Optional)</label>
                <textarea name="interest" className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 text-white student-input-glow transition-all resize-none" placeholder="Mention your technical skills, projects, or specific fields you want to work in..." rows={4}></textarea>
              </div>
            </section>

            {/* Section 4: Upload CV */}
            <section className="student-glass-panel student-glass-panel-accent p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white">Upload CV</h3>
              </div>
              <div 
                className="relative group border-2 border-dashed border-outline-variant rounded-xl p-12 transition-all duration-300 hover:border-primary hover:bg-primary/5 cursor-pointer text-center" 
                id="drop-zone"
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={handleDrop}
              >
                <input accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-input" type="file" onChange={handleFileChange} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#14213D] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl">upload_file</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg text-white font-bold">Drag &amp; drop your resume or <span className="text-primary underline">browse</span></p>
                    <p className="text-sm text-on-surface-variant">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>
                {fileName && (
                  <div className="mt-4 text-sm tracking-wider text-black font-semibold bg-primary py-2 px-4 rounded-full inline-block">
                    {fileName}
                  </div>
                )}
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-end gap-6 pt-8">
              <button className="w-full md:w-auto px-12 py-4 student-glass-panel text-white rounded-full font-semibold uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all text-sm" type="button" onClick={() => router.push('/')}>Go Back</button>
              <button disabled={isSubmitting} className="w-full md:w-auto px-16 py-4 bg-primary text-black rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(252,163,17,0.4)] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}