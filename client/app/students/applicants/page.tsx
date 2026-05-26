"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function ApplicantCard({ applicant, onApprove, onReject }: { applicant: any, onApprove: (id: string) => void, onReject: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`student-glass-panel p-8 rounded-lg transition-all group border border-white/5 inner-glow ${expanded ? 'ring-1 ring-primary/30' : ''} hover:shadow-[0_0_40px_rgba(252,163,17,0.1)]`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shrink-0 bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">person</span>
          </div>
          <div>
            <h3 className="font-bold text-2xl text-white tracking-tight">{applicant.first_name} {applicant.last_name}</h3>
            <p className="text-on-surface-variant font-semibold tracking-wider text-sm">{applicant.program}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest bg-white/5 border-white/10 text-on-surface-variant`}>
            New Application
          </div>
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-on-surface-variant hover:text-primary"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className={`expanded-content ${expanded ? 'active' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
          {/* Personal & Academic Info */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Full Name</label>
                <p className="text-base text-white">{applicant.first_name} {applicant.last_name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Department/Program</label>
                <p className="text-base text-white">{applicant.program}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Academic Background</label>
                <p className="text-base text-white">{applicant.academic_background}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Email Address</label>
                <p className="text-base text-white">{applicant.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Contact Number</label>
                <p className="text-base text-white">{applicant.phone}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Course Interest</label>
                <p className="text-sm leading-relaxed text-white">
                  {applicant.course_interest || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="student-glass-panel p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-sm tracking-wider text-white">Curriculum Vitae</h4>
              <button className="text-primary flex items-center gap-1 hover:brightness-125 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Download</span>
              </button>
            </div>
            <div className="flex-1 bg-black/40 rounded-lg border border-white/5 flex flex-col items-center justify-center p-8 text-center group/doc relative overflow-hidden h-48">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">description</span>
              <p className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-widest">Resume.pdf</p>
              
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
                <span className="font-semibold tracking-wider text-sm text-primary">Preview Document</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-12 pt-8 border-t border-white/5">
          <button 
            onClick={() => onReject(applicant.id)}
            className="px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-95"
          >
            Reject Application
          </button>
          <button 
            onClick={() => onApprove(applicant.id)}
            className="px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase bg-primary text-black hover:brightness-110 shadow-[0_10px_20px_rgba(252,163,17,0.2)] transition-all active:scale-95"
          >
            Accept Applicant
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/applicants")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplicants(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch applicants:", err));
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/applicants/${id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Applicant approved! Student Account created.");
        setApplicants(applicants.filter(app => app.id !== id));
      } else {
        toast.error("Failed to approve applicant. " + data.error);
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/applicants/${id}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Applicant rejected.");
        setApplicants(applicants.filter(app => app.id !== id));
      } else {
        toast.error("Failed to reject applicant.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    }
  };

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{__html: `
        .student-glass-panel {
            background: rgba(20, 33, 61, 0.7);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 50px rgba(4, 18, 46, 0.4);
        }
        .inner-glow {
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }
        .expanded-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.5s ease-in-out, opacity 0.3s ease;
            opacity: 0;
        }
        .expanded-content.active {
            max-height: 2000px;
            opacity: 1;
            margin-top: 1.5rem;
        }
      `}} />

      <div className="py-2 md:py-8 flex-1 animate-fade-in relative z-10 w-full max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">New Applicants</h2>
            <p className="text-on-surface-variant font-light text-lg">Review and manage recent enrollment requests for the Fall 2024 semester.</p>
          </div>
          <div className="flex gap-4">
            <div className="student-glass-panel px-6 py-3 rounded-xl flex items-center gap-3 border border-white/10">
              <span className="text-primary font-bold text-3xl leading-none">{applicants.length}</span>
              <span className="font-bold text-sm text-on-surface-variant uppercase tracking-widest">Pending<br/>Reviews</span>
            </div>
          </div>
        </div>

        {/* Applicants Grid/List */}
        <div className="space-y-6">
          {applicants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-lg">No pending applicants at the moment.</p>
            </div>
          ) : (
            applicants.map((app, i) => (
              <ApplicantCard key={app.id} applicant={app} onApprove={handleApprove} onReject={handleReject} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}