"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function StudentProfilePage() {
  const router = useRouter();

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{__html: `
        .student-glass-panel {
            background: rgba(20, 33, 61, 0.7);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(252, 163, 17, 0.1);
            box-shadow: 0 20px 50px rgba(4, 18, 46, 0.4);
        }
        .student-glass-panel-accent {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
        }
        .progress-glow {
            box-shadow: 0 0 15px rgba(252, 163, 17, 0.5);
        }
      `}} />

      <div className="py-2 md:py-8 flex-1 animate-fade-in relative z-10 w-full space-y-6">
        
        {/* Navigation Breadcrumb (Optional Addition based on flow) */}
        <div className="mb-4">
            <button onClick={() => router.back()} className="text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 text-sm font-semibold tracking-widest uppercase">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Students
            </button>
        </div>

        {/* Hero Profile Section */}
        <section className="student-glass-panel student-glass-panel-accent rounded-lg p-10 flex flex-col xl:flex-row items-center gap-10">
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 p-1">
              <img alt="Student Avatar" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8kqc_CY9rBUUIOXmsech18JwO9Yp8GNJXEnWYx4jEN6s5Rfu5NACBcBmvklVQXyqz8s6Z4HPWtlSgc5Yuuuw05_soFmu2hwf6tGUIFjxvmAy5kJ-Ih5kHXftBWJXZXtMkxoQeaSg_N84KtrFPFEbfTxy2wKq0A9KzDs-x3lrFYWoO5WsPS5wE-kL9HkAjd8v7aoWJjB2BcbXRHAaiOOUjSuUJCtAvzBSsTwrEeKDxelczkAlxAmXknQ396D4d_EOlo-i5nSisdjiN" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-[#000000] w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          
          <div className="flex-1 text-center xl:text-left">
            <h2 className="text-4xl font-bold text-primary mb-2 tracking-tight">Adrian Sterling</h2>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center xl:justify-start gap-4 items-center">
              <span className="text-white font-semibold text-sm tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">badge</span>
                ID: LMN-2024-0891
              </span>
              <span className="h-4 w-[1px] bg-white/20 hidden sm:block"></span>
              <span className="text-white font-semibold text-sm tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span>
                a.sterling@lumina.edu
              </span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30 uppercase tracking-widest">
                Postgraduate
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto mt-6 xl:mt-0">
            <button className="w-full sm:w-auto bg-primary text-black font-bold uppercase tracking-widest text-sm px-8 py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg">Edit Profile</button>
            <button className="w-full sm:w-auto bg-transparent border border-white/20 text-white font-bold px-4 py-3 rounded-lg hover:bg-white/5 active:scale-95 transition-all flex justify-center items-center">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </section>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Financial Overview (8 Columns) */}
          <div className="lg:col-span-8 student-glass-panel student-glass-panel-accent rounded-lg p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="font-bold text-2xl text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">payments</span>
                Financial Overview
              </h3>
              <button className="text-primary font-semibold text-sm tracking-widest uppercase hover:underline flex items-center gap-1">
                Download Ledger <span className="material-symbols-outlined text-sm">download</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-[#14213D]/40 p-6 rounded-lg border border-white/5">
                <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-2">Total Fee</p>
                <p className="text-3xl font-bold text-white">$12,450.00</p>
              </div>
              <div className="bg-[#14213D]/40 p-6 rounded-lg border border-white/5">
                <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-2">Paid Amount</p>
                <p className="text-3xl font-bold text-primary">$8,200.00</p>
              </div>
              <div className="bg-[#14213D]/40 p-6 rounded-lg border border-primary/20">
                <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-2">Remaining Balance</p>
                <p className="text-3xl font-bold text-red-500">$4,250.00</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="py-4 font-bold text-xs uppercase tracking-widest text-on-surface-variant">Month</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-widest text-on-surface-variant">Reference</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-widest text-on-surface-variant">Status</th>
                    <th className="py-4 font-bold text-xs uppercase tracking-widest text-on-surface-variant text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-4 text-white">March 2024</td>
                    <td className="py-4 text-on-surface-variant">#INV-882190</td>
                    <td className="py-4">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-primary/20">PAID</span>
                    </td>
                    <td className="py-4 text-right font-bold text-lg text-white">$2,050.00</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-white">February 2024</td>
                    <td className="py-4 text-on-surface-variant">#INV-881023</td>
                    <td className="py-4">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-primary/20">PAID</span>
                    </td>
                    <td className="py-4 text-right font-bold text-lg text-white">$2,050.00</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-white">January 2024</td>
                    <td className="py-4 text-on-surface-variant">#INV-879812</td>
                    <td className="py-4">
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-red-500/20">OVERDUE</span>
                    </td>
                    <td className="py-4 text-right font-bold text-lg text-white">$2,050.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Performance Metrics (4 Columns) */}
          <div className="lg:col-span-4 student-glass-panel student-glass-panel-accent rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-2xl text-white mb-10 w-full text-left">Performance</h3>
            
            {/* Radial Attendance Chart */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-primary progress-glow" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset="55.29" strokeLinecap="round" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-white">90%</p>
                <p className="text-on-surface-variant font-bold tracking-widest text-xs uppercase mt-1">Attendance</p>
              </div>
            </div>
            
            <div className="w-full space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold tracking-widest text-xs uppercase text-on-surface-variant">Assignment Average</span>
                  <span className="font-bold tracking-widest text-xs uppercase text-primary">88/100</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary progress-glow" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold tracking-widest text-xs uppercase text-on-surface-variant">Quiz Score</span>
                  <span className="font-bold tracking-widest text-xs uppercase text-primary">94/100</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary progress-glow" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 text-left">
                <p className="font-bold tracking-widest text-[10px] uppercase text-on-surface-variant mb-1">Overall Progress</p>
                <p className="text-2xl font-bold text-primary">Advanced Standing</p>
              </div>
            </div>
          </div>

          {/* Registered Courses (7 Columns) */}
          <div className="lg:col-span-7 student-glass-panel student-glass-panel-accent rounded-lg p-8">
            <h3 className="font-bold text-2xl text-white mb-8">Registered Courses</h3>
            <div className="space-y-4">
              {/* Course Card 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-lg bg-[#14213D]/30 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="w-full sm:w-20 h-40 sm:h-20 rounded-lg overflow-hidden shrink-0">
                  <img alt="Course Thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD037haOGu0hcqJQdyxU35wBpjUqrAnxhHCDKXU866GZvwqj1wXFKZr4gJljWui_ezzeFgZF1-JAUkCkUJUSpnz3zR2X_X-2rogfAirmntPfty4pHJU2gzGn7BHiPnDectbj2GWOPLZavfu-onwfiVv8BeWrZgnPOxx2z7So5TEKThn9EyF11telbJKd1YRKO5mrIew0xTlECCbOaOSjPGj-bzNkkieGjK6RisIS_mP9XwIpX4YyIMr3ssaTctRVYm8O_AY09zITQN4" />
                </div>
                <div className="flex-1 w-full">
                  <h4 className="font-bold text-lg text-white mb-1">Cybersecurity Architectures</h4>
                  <p className="text-on-surface-variant text-sm mb-4">Instructor: Dr. Elias Vance</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '75%' }}></div>
                    </div>
                    <span className="font-bold tracking-widest text-[10px] uppercase text-on-surface-variant">75% Complete</span>
                  </div>
                </div>
                <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0">
                  <span className="material-symbols-outlined">arrow_forward_ios</span>
                </button>
              </div>

              {/* Course Card 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-lg bg-[#14213D]/30 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="w-full sm:w-20 h-40 sm:h-20 rounded-lg overflow-hidden shrink-0">
                  <img alt="Course Thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNZ8hnwOvFbT537kL3RQOL32hBHz97A5HUS4aarhiAWWnNnM80Lnjv0djDSFR8WuwH_bdZfmo5E6fLNgEeN2aeTNX_IsmdW8FEkC2WUVo-9qSDGlCqnv76HI3ve4lkxKQM3cYatiioaE0KrVRS9qFaSQsHcYEGOtFTPOolhZ6eb2BmLpmUJmAeePDdThK-FCxz0bqfOz0WLbv8-1SQl2EJoOmrnEL3HFdVU346KQzf7LzPspXOz7LnETI8UiF5dx5ZVdrtfc8851XG" />
                </div>
                <div className="flex-1 w-full">
                  <h4 className="font-bold text-lg text-white mb-1">Data Science &amp; Ethics</h4>
                  <p className="text-on-surface-variant text-sm mb-4">Instructor: Prof. Sarah Chen</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-200" style={{ width: '42%' }}></div>
                    </div>
                    <span className="font-bold tracking-widest text-[10px] uppercase text-on-surface-variant">42% Complete</span>
                  </div>
                </div>
                <button className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0">
                  <span className="material-symbols-outlined">arrow_forward_ios</span>
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information (5 Columns) */}
          <div className="lg:col-span-5 student-glass-panel student-glass-panel-accent rounded-lg p-8">
            <h3 className="font-bold text-2xl text-white mb-8">Personal Information</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-1">Full Name</p>
                  <p className="text-white text-base">Adrian Sterling</p>
                </div>
                <div>
                  <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-1">Date of Birth</p>
                  <p className="text-white text-base">Oct 24, 1998</p>
                </div>
              </div>
              <div>
                <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-1">Address</p>
                <p className="text-white text-base leading-relaxed">4221 Kensington Court, West Avenue,<br/>London, SW1W 9TQ, United Kingdom</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-1">Emergency Contact</p>
                  <p className="text-white text-base">Elena Sterling (Mother)</p>
                </div>
                <div>
                  <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-1">Contact No.</p>
                  <p className="text-white text-base">+44 7700 900 121</p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <p className="font-bold tracking-widest text-on-surface-variant uppercase text-[10px] mb-4">Academic Counselor</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/30 shrink-0">
                    <img alt="Counselor" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlvzm5SlM_CMPmrbU6shkje_lhvCFRB4cVHeoTS8kPzZqVGTMS8j09Law8CeO_lnP-NJ7OX0vjKoYAC5Q7nIji9lmZWPV-jVSW_g83Q5lZJLG5DFKptvMgU524WCtJSexDt35j0V65eNRl7KwDdCW2nSYpyfwW-ZmnxamBl3aWRsdhVOtLuKobALUKDkb1tP3EHsa-V3w38Wdbh5fDa3cAGSYlGt4P_T-Ev9bULhlzMSeshiDYpjF750z6doB55c50nIcQRPGcS8yW" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base mb-1">Dr. Linda Hamilton</p>
                    <button className="text-xs text-primary font-bold tracking-widest uppercase hover:underline">Schedule a Meeting</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}