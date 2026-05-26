"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ApplicantCard({ applicant, index }: { applicant: any, index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`student-glass-panel p-8 rounded-lg transition-all group border border-white/5 inner-glow ${expanded ? 'ring-1 ring-primary/30' : ''} hover:shadow-[0_0_40px_rgba(252,163,17,0.1)]`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shrink-0">
            <img alt="Applicant" className="w-full h-full object-cover" src={applicant.avatar} />
          </div>
          <div>
            <h3 className="font-bold text-2xl text-white tracking-tight">{applicant.name}</h3>
            <p className="text-on-surface-variant font-semibold tracking-wider text-sm">{applicant.program}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${
            applicant.badgeType === 'priority' 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : applicant.badgeType === 'new' 
              ? 'bg-white/5 border-white/10 text-on-surface-variant'
            : 'bg-primary/10 border-primary/30 text-primary'
          }`}>
            {applicant.badgeLabel}
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
                <p className="text-base text-white">{applicant.fullName}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">{applicant.idLabel}</label>
                <p className="text-base text-white">{applicant.idValue}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Academic Background</label>
                <p className="text-base text-white">{applicant.academic}</p>
                <p className="text-on-surface-variant text-sm italic">{applicant.university}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Email Address</label>
                <p className="text-base text-white">{applicant.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">Contact Number</label>
                <p className="text-base text-white">{applicant.contact}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-1">{applicant.extraLabel}</label>
                <p className="text-sm leading-relaxed text-white">
                  {applicant.extraValue}
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
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">{applicant.docIcon}</span>
              <p className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-widest">{applicant.docName}</p>
              
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
                <span className="font-semibold tracking-wider text-sm text-primary">{applicant.docAction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-12 pt-8 border-t border-white/5">
          <button className="px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-95">
            Reject Application
          </button>
          <button className="px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase bg-primary text-black hover:brightness-110 shadow-[0_10px_20px_rgba(252,163,17,0.2)] transition-all active:scale-95">
            Accept Applicant
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantsPage() {
  const router = useRouter();

  const applicants = [
    {
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPQ5hB5TiY02HCz9jJMbS0ejTVFG87V44TUln1AHo7A6dwXx1ckeHwUbDaFsQlibzJ83ogpUZ3prkn9_baWWxXr8wX4hB2pCON2uHIPTpVc8ecWwhdUYYUrovotoivPWt-s6cPlV8SXwnyHs8pj65eobYAoRT8ZWRZ-AdRhXCuBUrapP68srg7DjhuvnGovMuDzwOWHLRJMU_YHc41iS9dVnEjvAka3tMPtoZeQOglEqfIvA5suSeCIKstPa77UBgGCKmKozlqyNuJ",
      name: "Julian Voss",
      program: "Masters in Artificial Intelligence",
      badgeType: "priority",
      badgeLabel: "High Priority",
      fullName: "Julian Voss van der Berg",
      idLabel: "National Identity (CNIC)",
      idValue: "42201-8893214-5",
      academic: "B.Sc. Computer Science (CGPA: 3.8/4.0)",
      university: "Technical University of Munich",
      email: "j.voss@academic-cloud.edu",
      contact: "+49 176 332 9982",
      extraLabel: "Statement of Purpose",
      extraValue: '"Driven to bridge the gap between traditional neural networks and neuro-symbolic AI for ethical automation."',
      docIcon: "description",
      docName: "voss_resume_2024.pdf",
      docAction: "Preview Document",
    },
    {
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDV3IVzdMNmJfg7gBkncAn_sJP3raZpqWCX-XUP185TrvvuU0I4pOqaXzXz1FRUB6557foiqqr2jN8v-iQloiIq5weni2jhQ8RQrVcg_Mhonl7aHTMiFjovO-xG3DRTOtyhtt1YjcZPHSFY7kAzyal9UYeFt5DvUOtAkrHxrJEMkHUCbV5D96SjIUVWm-jne91WLF0107KFKJ9IZbnK7zB0s6HwuvWkxCI5EsgaPkEvWS9L4ZLyRZDwBZdnIyw-1iO2RwR39BmnbAFy",
      name: "Maya Sterling",
      program: "MBA in Strategic Leadership",
      badgeType: "new",
      badgeLabel: "New",
      fullName: "Maya Elizabeth Sterling",
      idLabel: "CNIC",
      idValue: "42301-1194218-2",
      academic: "B.A. Economics (Summa Cum Laude)",
      university: "Wharton School of Business",
      email: "maya.sterling@enterprise-corp.com",
      contact: "+1 (555) 092-4410",
      extraLabel: "Work Experience",
      extraValue: "6+ Years at Goldman Sachs (Senior Analyst)",
      docIcon: "folder_shared",
      docName: "sterling_portfolio.zip",
      docAction: "Extract & Preview",
    },
    {
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn4MfdUobkwjp7VXWOKLWgeQBz5k_n02wf2WcJiTdA4lpN6Nmpc5ThqnZ6GmlD1rNVyumvfAf2Px2AK-ah6kGsL3Zm3NySH3QSZQLzO1bj325F87zTXHcvnRKuA-UCytNb7BZJtqT2pw4uPaIKAgYomTbiqiYVpUlKWDs8ZTh--DITpruUlo7ghNrPn7OZOq9Cm6VIPVDu6dFKiY3KDF8l8ujzufbE3hW9FmQ7LxZIQc8fZqXa8dGudU4XFaO3dPdc-1DicuwC9oem",
      name: "Chen Wei",
      program: "Ph.D. in Quantum Computing",
      badgeType: "fellow",
      badgeLabel: "Research Fellow",
      fullName: "Chen Wei Li",
      idLabel: "Passport Number (Intl)",
      idValue: "G9022314-X",
      academic: "M.Sc. Physics (Distinction)",
      university: "Tsinghua University",
      email: "c.wei@quantum-lab.tsinghua.edu",
      contact: "+86 138-0013-8000",
      extraLabel: "Publications",
      extraValue: "4 Core Journals (Nature, Science)",
      docIcon: "file_present",
      docName: "chen_research_cv.pdf",
      docAction: "Review CV",
    }
  ];

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
              <span className="text-primary font-bold text-3xl leading-none">24</span>
              <span className="font-bold text-sm text-on-surface-variant uppercase tracking-widest">Pending<br/>Reviews</span>
            </div>
          </div>
        </div>

        {/* Applicants Grid/List */}
        <div className="space-y-6">
          {applicants.map((app, i) => (
            <ApplicantCard key={i} applicant={app} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}