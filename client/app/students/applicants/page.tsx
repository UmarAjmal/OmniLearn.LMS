"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";


const TRACK_LABELS: Record<string, string> = {
  "fullstack-ai": "Full Stack AI Engineer",
  "devops": "DevOps",
  "app-dev": "App Development",
  "web-dev": "Web Development",
};

const TRACK_ICONS: Record<string, string> = {
  "fullstack-ai": "smart_toy",
  "devops": "cloud_sync",
  "app-dev": "phone_android",
  "web-dev": "code",
};

interface TrainingApplication {
  id: string;
  full_name: string;
  father_name: string;
  cnic: string;
  age: number;
  whatsapp: string;
  gmail: string;
  university_name: string;
  department: string;
  semester: number;
  tracks: string[];
  reference_code: string | null;
  status: string;
  created_at: string;
}

function ApproveWithNoteModal({
  applicant,
  onClose,
  onConfirm,
}: {
  applicant: TrainingApplication;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm(note);
    setIsLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(20,33,61,0.95)",
          border: "1px solid rgba(32,99,147,0.4)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #206393, #00a2ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#fff" }}>
              edit_note
            </span>
          </div>
          <div>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>
              Approve with Note
            </h3>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(206,229,255,0.5)", margin: "2px 0 0" }}>
              For: {applicant.full_name}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(206,229,255,0.8)", display: "block", marginBottom: "8px" }}>
            Approval Note (Optional)
          </label>
          <textarea
            placeholder="e.g. Please bring your original documents on Day 1. Training starts 15th July..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(32,99,147,0.3)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "rgba(206,229,255,0.7)",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              background: isLoading ? "rgba(32,99,147,0.4)" : "linear-gradient(135deg, #206393, #00a2ff)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isLoading && (
              <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>
                progress_activity
              </span>
            )}
            Approve & Send Email
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ApplicantCard({
  applicant,
  onApprove,
  onApproveWithNote,
  onReject,
}: {
  applicant: TrainingApplication;
  onApprove: (id: string) => void;
  onApproveWithNote: (app: TrainingApplication) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    await onApprove(applicant.id);
    setActionLoading(null);
  };

  const handleReject = async () => {
    setActionLoading("reject");
    await onReject(applicant.id);
    setActionLoading(null);
  };

  return (
    <div
      style={{
        background: "rgba(20,33,61,0.7)",
        backdropFilter: "blur(25px)",
        border: expanded ? "1px solid rgba(32,99,147,0.45)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "24px",
        transition: "all 0.3s ease",
        boxShadow: expanded ? "0 8px 40px rgba(32,99,147,0.2)" : "0 2px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Card Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(32,99,147,0.4), rgba(0,162,255,0.2))",
              border: "1px solid rgba(32,99,147,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#cee5ff" }}>
              person
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>
                {applicant.full_name}
              </h3>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "100px",
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  color: "#fbbf24",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                ● Pending
              </span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "rgba(206,229,255,0.5)", margin: "4px 0 0" }}>
              {applicant.university_name} · {applicant.department} · Sem {applicant.semester}
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {applicant.tracks.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    background: "rgba(32,99,147,0.2)",
                    border: "1px solid rgba(32,99,147,0.35)",
                    borderRadius: "100px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#cee5ff",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{TRACK_ICONS[t] || "code"}</span>
                  {TRACK_LABELS[t] || t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(206,229,255,0.35)" }}>
            {timeAgo(applicant.created_at)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(206,229,255,0.6)",
              transition: "all 0.2s",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", marginBottom: "28px" }}>
            {[
              { label: "Father's Name", value: applicant.father_name, icon: "family_restroom" },
              { label: "CNIC", value: applicant.cnic, icon: "badge" },
              { label: "Age", value: `${applicant.age} years`, icon: "cake" },
              { label: "WhatsApp", value: applicant.whatsapp, icon: "smartphone" },
              { label: "Gmail", value: applicant.gmail, icon: "mail" },
              { label: "Reference Code", value: applicant.reference_code || "None", icon: "confirmation_number" },
            ].map(({ label, value, icon }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "rgba(206,229,255,0.35)" }}>
                    {icon}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(206,229,255,0.35)" }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#fff", margin: 0, wordBreak: "break-all" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={handleReject}
              disabled={!!actionLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                color: "#f87171",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                transition: "all 0.2s",
                opacity: actionLoading === "reject" ? 0.6 : 1,
              }}
            >
              {actionLoading === "reject" ? (
                <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>progress_activity</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
              )}
              Reject
            </button>

            <button
              onClick={() => onApproveWithNote(applicant)}
              disabled={!!actionLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(32,99,147,0.4)",
                background: "rgba(32,99,147,0.15)",
                color: "#93c5fd",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit_note</span>
              Approve with Note
            </button>

            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: actionLoading === "approve" ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg, #15803d, #22c55e)",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
                transition: "all 0.2s",
              }}
            >
              {actionLoading === "approve" ? (
                <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>progress_activity</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
              )}
              Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingApplicantsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteModalApp, setNoteModalApp] = useState<TrainingApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch(`/api/training-applications`);
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch (err) {
      console.error("Failed to fetch training applications:", err);
      toast.error("Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    // Poll every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const handleApprove = async (id: string, note?: string) => {
    try {
      const res = await fetch(`/api/training-applications/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || "" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Application approved! Confirmation email sent.");
        setApplications((prev) => prev.filter((a) => a.id !== id));
        setNoteModalApp(null);
      } else {
        toast.error("Failed to approve: " + data.error);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/training-applications/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.info("❌ Application rejected. Rejection email sent.");
        setApplications((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to reject: " + data.error);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <div className="p-2 md:p-8 flex-1 animate-fade-in relative z-10 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push("/students")}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Training Applications
              </h2>
            </div>
            <p className="text-on-surface-variant font-light text-base mt-1 ml-12">
              Review FalconSwift Training & Internship applications — approve or reject with email notification.
            </p>
          </div>

          <div className="flex gap-4">
            <div
              style={{
                background: "rgba(20,33,61,0.7)",
                backdropFilter: "blur(25px)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 50px rgba(4,18,46,0.4)",
              }}
              className="px-6 py-3 rounded-xl flex items-center gap-3"
            >
              <span className="text-primary font-bold text-3xl leading-none">{applications.length}</span>
              <span className="font-bold text-sm text-on-surface-variant uppercase tracking-widest">
                Pending<br />Reviews
              </span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-on-surface-variant text-sm font-light">Loading training applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                background: "rgba(20,33,61,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "rgba(206,229,255,0.2)", display: "block", marginBottom: "16px" }}>
                inbox
              </span>
              <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: "rgba(206,229,255,0.5)", margin: "0 0 8px" }}>
                No Pending Applications
              </h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(206,229,255,0.3)", margin: 0 }}>
                All caught up! New applications will appear here automatically.
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicantCard
                key={app.id}
                applicant={app}
                onApprove={handleApprove}
                onApproveWithNote={setNoteModalApp}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      </div>

      {/* Approve with Note Modal */}
      {noteModalApp && (
        <ApproveWithNoteModal
          applicant={noteModalApp}
          onClose={() => setNoteModalApp(null)}
          onConfirm={(note) => handleApprove(noteModalApp.id, note)}
        />
      )}

      {/* Background decorations */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}