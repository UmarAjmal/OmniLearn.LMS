"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{__html: `
        .student-glass-panel {
            background: rgba(20, 33, 61, 0.7);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 50px rgba(4, 18, 46, 0.4);
        }
      `}} />

      <div className="p-2 md:p-8 flex-1 animate-fade-in relative z-10 w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Registered Students</h2>
            <p className="text-on-surface-variant font-light text-base mt-2">Manage enrollments and monitor academic progression across the institution.</p>
          </div>
          <button 
            type="button"
            onClick={() => router.push("/students/applicants")}
            className="bg-primary text-black font-bold px-8 py-4 rounded-xl flex items-center gap-3 shadow-[0_15px_30px_rgba(252,163,17,0.3)] hover:shadow-[0_20px_40px_rgba(252,163,17,0.4)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="font-semibold text-sm tracking-widest uppercase">New Applicants</span>
          </button>
        </div>

        {/* Dashboard Filters / Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Total Enrolled</p>
              <p className="text-2xl font-bold text-white">1,284</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Paid Status</p>
              <p className="text-2xl font-bold text-white">82%</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 shrink-0">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Avg. Grade</p>
              <p className="text-2xl font-bold text-white">A- (3.8)</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 shrink-0">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Unpaid Fees</p>
              <p className="text-2xl font-bold text-white">42</p>
            </div>
          </div>
        </div>

        {/* Table Filters Glass */}
        <div className="student-glass-panel p-6 rounded-t-3xl border-b-0 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-4 pr-10 appearance-none text-white focus:outline-none focus:border-primary/50 cursor-pointer">
                <option className="bg-[#14213D]" value="">All Courses</option>
                <option className="bg-[#14213D]" value="cs">Computer Science 101</option>
                <option className="bg-[#14213D]" value="da">Data Architecture</option>
                <option className="bg-[#14213D]" value="ui">Advanced UI Design</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-4 pr-10 appearance-none text-white focus:outline-none focus:border-primary/50 cursor-pointer">
                <option className="bg-[#14213D]" value="">Payment Status</option>
                <option className="bg-[#14213D]" value="paid">Paid</option>
                <option className="bg-[#14213D]" value="partial">Partial</option>
                <option className="bg-[#14213D]" value="unpaid">Unpaid</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col w-full lg:w-auto sm:flex-row items-center gap-3">
            <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all text-on-surface-variant">
              <span className="material-symbols-outlined">filter_list</span>
              <span className="text-sm font-semibold tracking-wider uppercase">More Filters</span>
            </button>
            <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all text-on-surface-variant">
              <span className="material-symbols-outlined">download</span>
              <span className="text-sm font-semibold tracking-wider uppercase">Export</span>
            </button>
          </div>
        </div>

        {/* Professional Data Table */}
        <div className="student-glass-panel rounded-b-3xl overflow-hidden border-t-0 shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-sm font-semibold text-on-surface-variant uppercase tracking-widest">Student Name</th>
                  <th className="px-6 py-5 text-sm font-semibold text-on-surface-variant uppercase tracking-widest">Registered Course</th>
                  <th className="px-6 py-5 text-sm font-semibold text-on-surface-variant uppercase tracking-widest">Payment Status</th>
                  <th className="px-6 py-5 text-sm font-semibold text-on-surface-variant uppercase tracking-widest">Performance</th>
                  <th className="px-8 py-5 text-sm font-semibold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Row 1 */}
                <tr className="hover:bg-white/5 transition-colors group cursor-pointer hover:translate-x-1 duration-200" onClick={() => router.push('/students/1')}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img alt="Student Profile" className="w-12 h-12 rounded-full border border-white/10 group-hover:border-primary/50 transition-all object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#000000] rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">Elena Sokolov</p>
                        <p className="text-on-surface-variant/60 text-xs">elena.s@institutional.edu</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-white font-medium block">Advanced UI Design</span>
                    <span className="text-xs text-on-surface-variant/50">Cohort: Fall 2024</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      Paid
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-white font-bold">94%</span>
                        <span className="text-[10px] text-on-surface-variant">Top 5%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary shadow-[0_0_8px_rgba(252,163,17,0.6)]" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-white/5 transition-colors group cursor-pointer hover:translate-x-1 duration-200" onClick={() => router.push('/students/2')}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img alt="Student Profile" className="w-12 h-12 rounded-full border border-white/10 group-hover:border-primary/50 transition-all object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqg6lDqFufGA9x0LwbeSh0Mr3Uc1oXYQlvy_j5H_g9nVnr3W4x8WlfILXtJiBevVZ3_c1aeHNxmCv1LaKbUQNP1E2vI50qJ3TeZ6oUTlm18EGEdmv13wUbgXPk-DYCBIci6nKiOKu2dRfiZ-mPZyFdZ2sVldoSx9CvvMZlXMnfiAJQZKll-Sj53cFwyDU3xbjLh6BzNfsQZCg4p_DQZ6UxBJSRsRMIbvzS2jmxrUioshSTCpE-QH3iJ84-txlAB-KbdxYt992qMT4R" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 border-2 border-[#000000] rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">Marcus Knight</p>
                        <p className="text-on-surface-variant/60 text-xs">m.knight@institutional.edu</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-white font-medium block">Data Architecture</span>
                    <span className="text-xs text-on-surface-variant/50">Cohort: Fall 2024</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Partial
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-white font-bold">72%</span>
                        <span className="text-[10px] text-on-surface-variant">Improving</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-200" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-white/5 transition-colors group cursor-pointer hover:translate-x-1 duration-200" onClick={() => router.push('/students/3')}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img alt="Student Profile" className="w-12 h-12 rounded-full border border-white/10 group-hover:border-primary/50 transition-all object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa0Oqlh4FijmMIUgyEIAjtq6L6al5O1wWksfJDlypBQ5Gt4Y1VIpXxaKypW9f5gx3vUpGRas-T4EQOnI_tOccnQDyQ_cOWzVseRuRM1w7cajgYlskkYBQEXfi-SZDPaeFmVAGA31V1NJhtsXBwWFl_DNVzN1TwWecR7rnowkpkQnXZQ-IYLTpUJeMqmZwIjY-ZPSjolb8f5mu4P_hMT5zIShEnUuP1Z_C9ypdGiQ5iWsmBSvLcHFsDc9ceoCrpe_GPzxEAGXCRbeJZ" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#000000] rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">Amara Lin</p>
                        <p className="text-on-surface-variant/60 text-xs">alin09@institutional.edu</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-white font-medium block">Machine Learning Essentials</span>
                    <span className="text-xs text-on-surface-variant/50">Cohort: Spring 2024</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      Unpaid
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-white font-bold">45%</span>
                        <span className="text-[10px] text-red-400 uppercase tracking-widest">At Risk</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination Footing */}
          <div className="p-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-wider text-on-surface-variant">Showing <span className="text-white">1 - 25</span> of 1,284 students</p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-lg bg-primary text-black flex items-center justify-center font-bold">1</button>
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant">2</button>
              <button className="hidden sm:flex w-10 h-10 rounded-lg bg-white/5 border border-white/10 items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant">3</button>
              <span className="px-2 text-on-surface-variant hidden sm:block">...</span>
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant">52</button>
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}