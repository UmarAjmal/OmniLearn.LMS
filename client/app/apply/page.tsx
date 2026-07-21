"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";


const TRACKS = [
  { id: "fullstack-ai", label: "Full Stack AI Engineer", icon: "smart_toy" },
  { id: "devops", label: "DevOps", icon: "cloud_sync" },
  { id: "app-dev", label: "App Development", icon: "phone_android" },
  { id: "web-dev", label: "Web Development", icon: "code" },
];

const DEPARTMENTS = [
  "CS / IT / SE",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Business Administration",
  "Mathematics",
  "Physics",
  "Commerce",
  "Other Department",
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface FormData {
  fullName: string;
  fatherName: string;
  cnic: string;
  age: string;
  whatsapp: string;
  gmail: string;
  universityName: string;
  department: string;
  semester: string;
  tracks: string[];
  referenceCode: string;
  createAccount: boolean;
  password?: string;
  confirmPassword?: string;
}

interface FormErrors {
  fullName?: string;
  fatherName?: string;
  cnic?: string;
  age?: string;
  whatsapp?: string;
  gmail?: string;
  universityName?: string;
  department?: string;
  semester?: string;
  tracks?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) errors.fullName = "Full name is required.";
  else if (data.fullName.trim().length < 3)
    errors.fullName = "Must be at least 3 characters.";

  if (!data.fatherName.trim()) errors.fatherName = "Father's name is required.";
  else if (data.fatherName.trim().length < 3)
    errors.fatherName = "Must be at least 3 characters.";

  const cnicClean = data.cnic.replace(/[-\s]/g, "");
  if (!data.cnic.trim()) errors.cnic = "CNIC number is required.";
  else if (!/^\d{13}$/.test(cnicClean))
    errors.cnic = "Enter a valid 13-digit CNIC (e.g. 3610012345678).";

  if (!data.age.trim()) errors.age = "Age is required.";
  else if (isNaN(Number(data.age)) || Number(data.age) < 16 || Number(data.age) > 40)
    errors.age = "Age must be between 16 and 40.";

  const waNum = data.whatsapp.replace(/[\s+\-()]/g, "");
  if (!data.whatsapp.trim()) errors.whatsapp = "WhatsApp number is required.";
  else if (!/^\d{10,14}$/.test(waNum))
    errors.whatsapp = "Enter a valid WhatsApp number.";

  if (!data.gmail.trim()) errors.gmail = "Gmail address is required.";
  else if (!/^[\w.+-]+@(gmail\.com)$/i.test(data.gmail.trim()))
    errors.gmail = "Enter a valid @gmail.com address.";

  if (!data.universityName.trim())
    errors.universityName = "University name is required.";

  if (!data.department) errors.department = "Please select your department.";

  if (!data.semester) errors.semester = "Please select your current semester.";

  if (data.tracks.length === 0)
    errors.tracks = "Please select at least one track.";
  else if (data.tracks.length > 3)
    errors.tracks = "You can select up to 3 tracks only.";

  if (data.createAccount) {
    if (!data.password || !data.password.trim()) {
      errors.password = "Password is required.";
    } else if (data.password.trim().length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!data.confirmPassword || !data.confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (data.confirmPassword.trim() !== data.password?.trim()) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    fatherName: "",
    cnic: "",
    age: "",
    whatsapp: "",
    gmail: "",
    universityName: "",
    department: "",
    semester: "",
    tracks: [],
    referenceCode: "",
    createAccount: true,
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [particles, setParticles] = useState<
    { x: number; y: number; size: number; opacity: number; speed: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.15,
        speed: Math.random() * 20 + 15,
      }))
    );
  }, []);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const newErrors = validate(form);
      const filteredErrors: FormErrors = {};
      (Object.keys(touched) as (keyof FormErrors)[]).forEach((key) => {
        if (touched[key] && newErrors[key]) {
          (filteredErrors as Record<string, string>)[key] = newErrors[key] as string;
        }
      });
      setErrors(filteredErrors);
    }
  }, [form, touched]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleTrackToggle = (trackId: string) => {
    setTouched((prev) => ({ ...prev, tracks: true }));
    setForm((prev) => {
      const already = prev.tracks.includes(trackId);
      if (already) {
        return { ...prev, tracks: prev.tracks.filter((t) => t !== trackId) };
      }
      if (prev.tracks.length >= 3) return prev;
      return { ...prev, tracks: [...prev.tracks, trackId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      [
        "fullName", "fatherName", "cnic", "age", "whatsapp",
        "gmail", "universityName", "department", "semester", "tracks",
        "password", "confirmPassword",
      ].map((k) => [k, true])
    );
    setTouched(allTouched);

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiClient(`/api/training-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          fatherName: form.fatherName.trim(),
          cnic: form.cnic.replace(/[-\s]/g, ""),
          age: Number(form.age),
          whatsapp: form.whatsapp.trim(),
          gmail: form.gmail.trim().toLowerCase(),
          universityName: form.universityName.trim(),
          department: form.department,
          semester: Number(form.semester),
          tracks: form.tracks,
          referenceCode: form.referenceCode.trim() || null,
          createAccount: form.createAccount,
          password: form.createAccount ? form.password?.trim() : "",
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        setSubmitError(resJson.error || "Something went wrong while submitting. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = (name: keyof FormErrors) => ({
    width: "100%",
    padding: "13px 16px",
    background: "rgba(255,255,255,0.04)",
    border: `1.5px solid ${
      errors[name]
        ? "#ef4444"
        : touched[name]
        ? "rgba(32,99,147,0.7)"
        : "rgba(255,255,255,0.12)"
    }`,
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "15px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "border-color 0.25s, box-shadow 0.25s",
    boxSizing: "border-box" as const,
    boxShadow: errors[name]
      ? "0 0 0 3px rgba(239,68,68,0.15)"
      : touched[name] && !errors[name]
      ? "0 0 0 3px rgba(32,99,147,0.15)"
      : "none",
  });

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#001836",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(32,99,147,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(32,99,147,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "560px",
            width: "100%",
            textAlign: "center",
            animation: "successPop 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #206393 0%, #00a2ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 32px",
              boxShadow: "0 20px 60px -10px rgba(32,99,147,0.6)",
              animation: "pulseGlow 2.5s ease-in-out infinite",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "52px", color: "#fff" }}
            >
              check_circle
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Hanken Grotesk, sans-serif",
              fontSize: "40px",
              fontWeight: 800,
              backgroundImage: "linear-gradient(160deg, #ffffff 0%, #cee5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 16px",
              lineHeight: "1.2",
            }}
          >
            Application Submitted!
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "17px",
              color: "rgba(206,229,255,0.75)",
              lineHeight: "28px",
              margin: "0 0 40px",
            }}
          >
            Thank you, <strong style={{ color: "#cee5ff" }}>{form.fullName}</strong>! Your
            registration for Falcon Swift Training &amp; Internships has been received. Our
            team will contact you on your WhatsApp within 2–3 business days.
          </p>

          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#206393",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "10px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "0 8px 24px -6px rgba(32,99,147,0.5)",
              transition: "all 0.3s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            Back to Home
          </a>
        </div>

        <style>{`
          @keyframes successPop {
            from { opacity: 0; transform: scale(0.92) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 20px 60px -10px rgba(32,99,147,0.6); }
            50%       { box-shadow: 0 20px 80px -4px rgba(0,162,255,0.7); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#001836",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(32,99,147,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(32,99,147,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Radial glows */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          right: "-10%",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(32,99,147,0.15) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,162,255,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            backgroundColor: "rgba(32,99,147,0.6)",
            opacity: p.opacity,
            animation: `floatParticle${i % 3} ${p.speed}s ease-in-out infinite`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      {/* Top Nav */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,24,54,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(32,99,147,0.2)",
        }}
      >
        <div
          className="apply-nav-inner"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #206393, #00a2ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(32,99,147,0.5)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#fff" }}>
                rocket_launch
              </span>
            </div>
            <span
              style={{
                fontFamily: "Hanken Grotesk, sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              FalconSwift
            </span>
          </a>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(206,229,255,0.7)",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            Back to Home
          </a>
        </div>
      </header>

      {/* Hero Header */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "72px 24px 48px",
          textAlign: "center",
          animation: "fadeInDown 0.8s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <h1
          style={{
            fontFamily: "Hanken Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800,
            lineHeight: "1.15",
            backgroundImage: "linear-gradient(160deg, #ffffff 0%, #cee5ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: "0 0 20px",
          }}
        >
          Falcon Swift Training
          <br />&amp; Internships Registration
        </h1>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            lineHeight: "27px",
            color: "rgba(206,229,255,0.65)",
            maxWidth: "580px",
            margin: "0 auto 8px",
          }}
        >
          Kindly fill this form very carefully. All the information provided here will be
          used for your official training and internship record, and{" "}
          <strong style={{ color: "rgba(206,229,255,0.9)" }}>
            cannot be changed later.
          </strong>
        </p>

        <div
          style={{
            width: "80px",
            height: "3px",
            background: "linear-gradient(90deg, #206393, #00a2ff)",
            borderRadius: "2px",
            margin: "28px auto 0",
          }}
        />
      </div>

      {/* Form */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "760px",
          margin: "0 auto",
          padding: "0 24px 80px",
          animation: "fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s both",
        }}
      >
        <form onSubmit={handleSubmit} noValidate>

          {/* Section 1: Personal Info */}
          <SectionCard icon="person" title="Personal Information" subtitle="Enter your official personal details">
            <div className="form-grid-2">
              <FieldGroup label="Full Name" required error={errors.fullName}>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Muhammad Ali Khan"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("fullName")}
                  style={fieldStyle("fullName")}
                  className="form-input"
                />
              </FieldGroup>

              <FieldGroup label="Father's Name" required error={errors.fatherName}>
                <input
                  id="fatherName"
                  name="fatherName"
                  type="text"
                  placeholder="e.g. Muhammad Tariq Khan"
                  value={form.fatherName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("fatherName")}
                  style={fieldStyle("fatherName")}
                  className="form-input"
                />
              </FieldGroup>
            </div>

            <div className="form-grid-2">
              <FieldGroup label="CNIC Number" required error={errors.cnic} hint="13 digits without dashes">
                <input
                  id="cnic"
                  name="cnic"
                  type="text"
                  placeholder="3610012345678"
                  maxLength={15}
                  value={form.cnic}
                  onChange={handleChange}
                  onBlur={() => handleBlur("cnic")}
                  style={fieldStyle("cnic")}
                  className="form-input"
                />
              </FieldGroup>

              <FieldGroup label="Age" required error={errors.age} hint="Between 16–40">
                <input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="e.g. 21"
                  min={16}
                  max={40}
                  value={form.age}
                  onChange={handleChange}
                  onBlur={() => handleBlur("age")}
                  style={fieldStyle("age")}
                  className="form-input"
                />
              </FieldGroup>
            </div>

            <div className="form-grid-2">
              <FieldGroup label="WhatsApp Number" required error={errors.whatsapp} hint="Include country code, e.g. +92XXXXXXXXXX">
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={form.whatsapp}
                  onChange={handleChange}
                  onBlur={() => handleBlur("whatsapp")}
                  style={fieldStyle("whatsapp")}
                  className="form-input"
                />
              </FieldGroup>

              <FieldGroup label="Gmail Address" required error={errors.gmail} hint="Must be a @gmail.com address">
                <input
                  id="gmail"
                  name="gmail"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={form.gmail}
                  onChange={handleChange}
                  onBlur={() => handleBlur("gmail")}
                  style={fieldStyle("gmail")}
                  className="form-input"
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section 2: University */}
          <SectionCard icon="school" title="University Details" subtitle="Provide your current academic information">
            <FieldGroup label="University Name" required error={errors.universityName}>
              <input
                id="universityName"
                name="universityName"
                type="text"
                placeholder="e.g. COMSATS University Islamabad"
                value={form.universityName}
                onChange={handleChange}
                onBlur={() => handleBlur("universityName")}
                style={fieldStyle("universityName")}
                className="form-input"
              />
            </FieldGroup>

            <div className="form-grid-2">
              <FieldGroup label="Select Your Department / Degree" required error={errors.department}>
                <div style={{ position: "relative" }}>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    onBlur={() => handleBlur("department")}
                    required
                    style={{
                      ...fieldStyle("department"),
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: "40px",
                      cursor: "pointer",
                    }}
                    className="form-input"
                  >
                    <option value="" disabled style={{ backgroundColor: "#001836", color: "#ffffff" }}>
                      Select department
                    </option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} style={{ backgroundColor: "#001836", color: "#ffffff" }}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "20px",
                      color: "rgba(206,229,255,0.4)",
                      pointerEvents: "none",
                    }}
                  >
                    expand_more
                  </span>
                </div>
              </FieldGroup>

              <FieldGroup label="Current Semester" required error={errors.semester}>
                <div style={{ position: "relative" }}>
                  <select
                    id="semester"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    onBlur={() => handleBlur("semester")}
                    required
                    style={{
                      ...fieldStyle("semester"),
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: "40px",
                      cursor: "pointer",
                    }}
                    className="form-input"
                  >
                    <option value="" disabled style={{ backgroundColor: "#001836", color: "#ffffff" }}>
                      Select semester
                    </option>
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s} style={{ backgroundColor: "#001836", color: "#ffffff" }}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "20px",
                      color: "rgba(206,229,255,0.4)",
                      pointerEvents: "none",
                    }}
                  >
                    expand_more
                  </span>
                </div>
              </FieldGroup>
            </div>
          </SectionCard>

          {/* Section 3: Track Selection */}
          <SectionCard icon="rocket_launch" title="Track Selection" subtitle="Select up to 3 tracks you want to apply for">
            <div className="tracks-grid">
              {TRACKS.map((track) => {
                const isSelected = form.tracks.includes(track.id);
                const isDisabled = !isSelected && form.tracks.length >= 3;
                return (
                  <button
                    key={track.id}
                    type="button"
                    id={`track-${track.id}`}
                    onClick={() => !isDisabled && handleTrackToggle(track.id)}
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(32,99,147,0.35) 0%, rgba(0,162,255,0.15) 100%)"
                        : "rgba(255,255,255,0.03)",
                      border: `2px solid ${
                        isSelected
                          ? "#206393"
                          : errors.tracks && touched.tracks
                          ? "rgba(239,68,68,0.4)"
                          : "rgba(255,255,255,0.1)"
                      }`,
                      borderRadius: "14px",
                      padding: "20px 16px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.45 : 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "12px",
                      textAlign: "left",
                      transition: "all 0.25s ease",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: isSelected
                        ? "0 4px 24px -4px rgba(32,99,147,0.4)"
                        : "none",
                    }}
                    className="track-card"
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #206393, #00a2ff)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "14px", color: "#fff" }}
                        >
                          check
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: isSelected
                          ? "linear-gradient(135deg, #206393, #00a2ff)"
                          : "rgba(32,99,147,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.25s",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "22px",
                          color: isSelected ? "#fff" : "rgba(206,229,255,0.6)",
                        }}
                      >
                        {track.icon}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isSelected ? "#ffffff" : "rgba(206,229,255,0.7)",
                        lineHeight: "1.3",
                        transition: "color 0.25s",
                      }}
                    >
                      {track.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              {errors.tracks && touched.tracks ? (
                <ErrorMsg message={errors.tracks} />
              ) : (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "rgba(206,229,255,0.4)" }}>
                  Select 1–3 tracks
                </span>
              )}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: form.tracks.length > 0 ? "#00a2ff" : "rgba(206,229,255,0.3)",
                  backgroundColor: "rgba(0,162,255,0.1)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  border: "1px solid rgba(0,162,255,0.2)",
                }}
              >
                {form.tracks.length} / 3 selected
              </span>
            </div>
          </SectionCard>

          {/* Section 4: Reference */}
          <SectionCard icon="handshake" title="Reference Details" subtitle="Optional — enter a reference code if you have one">
            <FieldGroup label="Reference Code" hint="Leave blank if not applicable">
              <input
                id="referenceCode"
                name="referenceCode"
                type="text"
                placeholder="e.g. FS-REF-2025"
                value={form.referenceCode}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  transition: "border-color 0.25s",
                  boxSizing: "border-box" as const,
                }}
                className="form-input"
              />
            </FieldGroup>
          </SectionCard>

          {/* Section 5: Portal Account */}
          <SectionCard icon="lock" title="Create Portal Login Account" subtitle="Create your credentials to access the portal once approved">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <input
                id="createAccount"
                name="createAccount"
                type="checkbox"
                checked={form.createAccount}
                onChange={(e) => setForm(prev => ({ ...prev, createAccount: e.target.checked }))}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <label htmlFor="createAccount" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#ffffff", fontWeight: 600, cursor: "pointer" }}>
                Create a student login account for this portal
              </label>
            </div>

            {form.createAccount && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(206,229,255,0.6)" }}>
                    Username: <strong style={{ color: "#ffffff" }}>{form.gmail || "(Enter Gmail above)"}</strong>
                  </span>
                </div>
                
                <div className="form-grid-2">
                  <FieldGroup label="Password" required error={errors.password}>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur("password")}
                      style={fieldStyle("password")}
                      className="form-input"
                    />
                  </FieldGroup>

                  <FieldGroup label="Confirm Password" required error={errors.confirmPassword}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="confirmPassword"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur("confirmPassword")}
                      style={fieldStyle("confirmPassword")}
                      className="form-input"
                    />
                  </FieldGroup>
                </div>
              </>
            )}

            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "rgba(32,99,147,0.1)",
                border: "1px solid rgba(32,99,147,0.25)",
                borderRadius: "10px",
              }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "rgba(206,229,255,0.7)", margin: 0, lineHeight: 1.5 }}>
                ℹ️ If you face any issues while creating your login account, please email us at <a href="mailto:info@falconswift.online" style={{ color: "#00a2ff", textDecoration: "underline" }}>info@falconswift.online</a>.
              </p>
            </div>
          </SectionCard>

          {/* Submit */}
          <div style={{ marginTop: "8px" }}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "rgba(206,229,255,0.45)",
                textAlign: "center",
                lineHeight: "20px",
                marginBottom: "24px",
              }}
            >
              By submitting, you confirm that all information is accurate and you agree to our
              terms. Information cannot be changed after submission.
            </p>

             {submitError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  animation: "fadeInUp 0.3s ease both",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", color: "#ef4444", flexShrink: 0, marginTop: "1px" }}
                >
                  error
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      color: "#fca5a5",
                      lineHeight: "1.5",
                    }}
                  >
                    {submitError}
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "rgba(252,165,165,0.8)",
                      lineHeight: "1.4",
                    }}
                  >
                    If you face any issues while creating your login, please email us at <strong>info@falconswift.online</strong>.
                  </span>
                </div>
              </div>
            )}

            <button
              id="submit-application"
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "17px 32px",
                background: isSubmitting
                  ? "rgba(32,99,147,0.5)"
                  : "linear-gradient(135deg, #206393 0%, #1a5280 100%)",
                border: "1px solid rgba(32,99,147,0.6)",
                borderRadius: "12px",
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.3s ease",
                boxShadow: isSubmitting ? "none" : "0 8px 32px -6px rgba(32,99,147,0.6)",
              }}
              className="submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px", animation: "spin 1s linear infinite" }}
                  >
                    progress_activity
                  </span>
                  Submitting Application...
                </>
              ) : (
                <>
                  Submit Application
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    send
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatParticle0 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50%       { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes floatParticle1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50%       { transform: translateY(25px) translateX(-20px); }
        }
        @keyframes floatParticle2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50%       { transform: translateY(-20px) translateX(-10px); }
        }

        .form-input:hover:not(:focus) {
          border-color: #206393 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          color: #001836 !important;
          box-shadow: 0 0 0 2px rgba(32, 99, 147, 0.15) !important;
          transition: all 0.2s ease !important;
        }
        .form-input:focus {
          border-color: #206393 !important;
          box-shadow: 0 0 0 3px rgba(32, 99, 147, 0.25), 0 0 16px rgba(0, 162, 255, 0.15) !important;
          background: #ffffff !important;
          color: #001836 !important;
          outline: none !important;
        }
        .form-input:not(:placeholder-shown):not(:focus) {
          border-color: rgba(32, 99, 147, 0.4) !important;
          background: #f1f5f9 !important;
          color: #001836 !important;
        }
        .form-input:not(:placeholder-shown):hover:not(:focus) {
          border-color: #206393 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          color: #001836 !important;
        }
        select.form-input:valid:not(:focus) {
          border-color: rgba(32, 99, 147, 0.4) !important;
          background: #f1f5f9 !important;
          color: #001836 !important;
        }
        select.form-input:valid:hover:not(:focus) {
          border-color: #206393 !important;
          background: rgba(255, 255, 255, 0.95) !important;
          color: #001836 !important;
        }
        select.form-input option {
          background-color: #001836 !important;
          color: #ffffff !important;
        }
        .form-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #f1f5f9 inset !important;
          box-shadow: 0 0 0 1000px #f1f5f9 inset !important;
          -webkit-text-fill-color: #001836 !important;
          color: #001836 !important;
          border-color: rgba(32, 99, 147, 0.4) !important;
          caret-color: #001836 !important;
        }
        .form-input::placeholder {
          color: rgba(206, 229, 255, 0.35) !important;
        }
        .form-input[type="number"]::-webkit-outer-spin-button,
        .form-input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .form-input[type="number"] { -moz-appearance: textfield; }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }
        .tracks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .track-card:hover:not([style*="not-allowed"]) {
          transform: translateY(-2px);
          border-color: rgba(32, 99, 147, 0.5) !important;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2b7cb7 0%, #206393 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px -8px rgba(32, 99, 147, 0.7) !important;
        }
        .apply-nav-inner {
          padding: 14px 64px !important;
        }

        @media (max-width: 768px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
          .tracks-grid { grid-template-columns: 1fr 1fr !important; }
          .apply-nav-inner { padding: 14px 24px !important; }
        }
        @media (max-width: 480px) {
          .tracks-grid { grid-template-columns: 1fr !important; }
          .apply-nav-inner { padding: 12px 16px !important; }
        }
      `}</style>
    </div>
  );
}

/* Sub-components */

function SectionCard({
  icon, title, subtitle, children,
}: {
  icon: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(32,99,147,0.2)",
        borderRadius: "20px",
        padding: "32px",
        marginBottom: "24px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 4px 32px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "28px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(32,99,147,0.15)",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(32,99,147,0.4), rgba(0,162,255,0.2))",
            border: "1px solid rgba(32,99,147,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#cee5ff" }}>
            {icon}
          </span>
        </div>
        <div>
          <h2
            style={{
              fontFamily: "Hanken Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              lineHeight: "1.2",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "rgba(206,229,255,0.5)",
              margin: "4px 0 0",
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "rgba(206,229,255,0.85)",
          letterSpacing: "0.02em",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#ef4444", fontSize: "15px", lineHeight: 1 }}>*</span>
        )}
      </label>
      {hint && (
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(206,229,255,0.35)", marginTop: "-2px" }}>
          {hint}
        </span>
      )}
      {children}
      {error && <ErrorMsg message={error} />}
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#ef4444" }}>
        error
      </span>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#ef4444", fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}
