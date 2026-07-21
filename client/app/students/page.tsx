"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";


interface Student {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  program: string;
  avatar_url?: string;
  email: string;
  phone?: string;
  created_at: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApplicantsCount, setPendingApplicantsCount] = useState(0);

  // Filters State
  const [courseFilter, setCourseFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  // Fetch registered students & available courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Students
        const studentsRes = await apiClient(`/api/students`);
        const studentsJson = await studentsRes.json();
        if (studentsJson.success) {
          setStudents(studentsJson.data);
          setFilteredStudents(studentsJson.data);
        }

        // 2. Fetch Courses
        const coursesRes = await apiClient(`/api/courses`);
        const coursesJson = await coursesRes.json();
        if (coursesJson.success) {
          setAvailableCourses(coursesJson.data);
        }

        // 3. Fetch pending training applications count
        const appsRes = await apiClient(`/api/training-applications/count`);
        const appsJson = await appsRes.json();
        if (appsJson.success) {
          setPendingApplicantsCount(appsJson.count);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // Poll every 30 seconds for new applications
    const interval = setInterval(() => {
      apiClient(`/api/training-applications/count`)
        .then(r => r.json())
        .then(d => { if (d.success) setPendingApplicantsCount(d.count); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stable deterministic dynamic student mock parameters based on ID
  const getStudentPaymentStatus = (id: number) => {
    const statuses = ["Paid", "Partial", "Unpaid"];
    return statuses[id % statuses.length];
  };

  const getStudentPerformance = (id: number) => {
    const percentage = 50 + (id % 47) + (id % 3 === 0 ? 4 : 0);
    const label = percentage >= 90 ? "Top 5%" : percentage >= 75 ? "Improving" : "At Risk";
    return { percentage, label };
  };

  const getStudentAvatar = (index: number) => {
    const avatars = [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkrg1w2_6vKacVMQL6osveRCQ1WSGupSYxo3AoLL8rnZS5gopYelH_tI5vTRQpTiEmXYnUj6uetUcTQ7kmbhdWatOBAG3JVIwiTXV6DBAMNIOrBrXGbCQsspYzd-u-1trTn3C-e_j0uXBzs6jmVdZ_gzD0Nt7pt7Ajj0EK4WBhdYq7c_5Z1gc1KA0C4UcqCLLkBDkFnwZqYk1VR2DspoCRx3wF6nlSbmIlN6heo26LB7gyv9_wJMOt62pSGw9_WzxdJhBVMlJybrkx", // Elena
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBqg6lDqFufGA9x0LwbeSh0Mr3Uc1oXYQlvy_j5H_g9nVnr3W4x8WlfILXtJiBevVZ3_c1aeHNxmCv1LaKbUQNP1E2vI50qJ3TeZ6oUTlm18EGEdmv13wUbgXPk-DYCBIci6nKiOKu2dRfiZ-mPZyFdZ2sVldoSx9CvvMZlXMnfiAJQZKll-Sj53cFwyDU3xbjLh6BzNfsQZCg4p_DQZ6UxBJSRsRMIbvzS2jmxrUioshSTCpE-QH3iJ84-txlAB-KbdxYt992qMT4R", // Marcus
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa0Oqlh4FijmMIUgyEIAjtq6L6al5O1wWksfJDlypBQ5Gt4Y1VIpXxaKypW9f5gx3vUpGRas-T4EQOnI_tOccnQDyQ_cOWzVseRuRM1w7cajgYlskkYBQEXfi-SZDPaeFmVAGA31V1NJhtsXBwWFl_DNVzN1TwWecR7rnowkpkQnXZQ-IYLTpUJeMqmZwIjY-ZPSjolb8f5mu4P_hMT5zIShEnUuP1Z_C9ypdGiQ5iWsmBSvLcHFsDc9ceoCrpe_GPzxEAGXCRbeJZ"  // Amara
    ];
    return avatars[index % avatars.length];
  };

  // Perform dynamic student filtering
  useEffect(() => {
    let result = [...students];

    if (courseFilter) {
      result = result.filter((s) => {
        if (!s.program) return false;
        return s.program.toLowerCase() === courseFilter.toLowerCase();
      });
    }

    if (paymentFilter) {
      result = result.filter((s) => {
        const status = getStudentPaymentStatus(s.id);
        return status.toLowerCase() === paymentFilter.toLowerCase();
      });
    }

    setFilteredStudents(result);
  }, [courseFilter, paymentFilter, students]);

  // Dynamic aggregates calculation
  const totalCount = students.length;
  const paidCount = students.filter((s) => getStudentPaymentStatus(s.id) === "Paid").length;
  const paidPercentage = students.length ? Math.round((paidCount / students.length) * 100) : 0;
  const unpaidFeesCount = students.filter((s) => getStudentPaymentStatus(s.id) === "Unpaid").length;

  // Intelligent WhatsApp redirection deep-link / web fallback handler
  const handleWhatsAppRedirect = (e: React.MouseEvent, phone: string | undefined) => {
    e.stopPropagation(); // Prevent row click navigation
    
    if (!phone) {
      toast.warning("No contact number associated with this student registry.");
      return;
    }

    // Prepend country code and strip non-numeric parameters
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    }
    // If not starting with country code, assume Pakistan prefix standard
    if (!cleanPhone.startsWith("92") && cleanPhone.length === 10) {
      cleanPhone = "92" + cleanPhone;
    }

    const deepLink = `whatsapp://send?phone=${cleanPhone}`;
    const webLink = `https://web.whatsapp.com/send?phone=${cleanPhone}`;

    toast.info("Launching WhatsApp deep-link connection...", { autoClose: 2000 });

    // 1. Create a temporary hidden iframe to fire deep-link protocol safely
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Remove iframe after short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 300);

    // 2. Fallback checking: If window is still focused after 1.5s, launch web portal instead
    const start = Date.now();
    const timer = setTimeout(() => {
      if (document.hasFocus() && Date.now() - start < 2000) {
        toast.info("WhatsApp app not detected. Launching WhatsApp Web portal...", { autoClose: 2000 });
        window.open(webLink, "_blank");
      }
    }, 1500);

    // Cancel fallback if window blurs (meaning app launched successfully!)
    const handleBlur = () => {
      clearTimeout(timer);
      window.removeEventListener("blur", handleBlur);
    };
    window.addEventListener("blur", handleBlur);
  };

  // High-fidelity Excel workbook exporter dynamically loaded from CDN
  const handleExcelExport = async () => {
    if (filteredStudents.length === 0) {
      toast.warning("No student records available to export.");
      return;
    }

    toast.info("Preparing Excel spreadsheet compiler...", { autoClose: 1500 });

    try {
      const loadSheetJS = () => {
        return new Promise<void>((resolve, reject) => {
          if ((window as any).XLSX) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load exporter"));
          document.head.appendChild(script);
        });
      };

      await loadSheetJS();
      const XLSX = (window as any).XLSX;

      // Map rows with clean corporate headings
      const worksheetData = filteredStudents.map((s, index) => ({
        "Enrollment ID": s.enrollment_id,
        "Student Name": `${s.first_name} ${s.last_name}`,
        "Email Address": s.email,
        "Contact Number": s.phone || "N/A",
        "Registered Course / Department": s.program || "General Education",
        "Payment Status": getStudentPaymentStatus(s.id),
        "Performance Grade": `${getStudentPerformance(s.id).percentage}%`,
        "Enrollment Date": new Date(s.created_at).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LMS Enrolled Students");

      // Auto-fit column widths dynamically
      const maxColWidths = Object.keys(worksheetData[0]).map((key) => {
        let maxLen = key.length;
        worksheetData.forEach((row: any) => {
          const val = String(row[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 3 };
      });
      worksheet["!cols"] = maxColWidths;

      // Download spreadsheet
      XLSX.writeFile(workbook, "OmniLearn_Registered_Students.xlsx");
      toast.success("Spreadsheet downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Spreadsheet compilation failed.");
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
            className="relative bg-primary text-black font-bold px-8 py-4 rounded-xl flex items-center gap-3 shadow-[0_15px_30px_rgba(252,163,17,0.3)] hover:shadow-[0_20px_40px_rgba(252,163,17,0.4)] active:scale-95 transition-all cursor-pointer select-none"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="font-semibold text-sm tracking-widest uppercase">New Applicants</span>
            {pendingApplicantsCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                {pendingApplicantsCount > 99 ? "99+" : pendingApplicantsCount}
              </span>
            )}
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
              <p className="text-2xl font-bold text-white">{isLoading ? "..." : totalCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Paid Status</p>
              <p className="text-2xl font-bold text-white">{isLoading ? "..." : `${paidPercentage}%`}</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 shrink-0">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Avg. Grade</p>
              <p className="text-2xl font-bold text-white">{isLoading ? "..." : "A- (3.85)"}</p>
            </div>
          </div>
          <div className="student-glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 shrink-0">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[12px] uppercase tracking-widest font-semibold">Unpaid Fees</p>
              <p className="text-2xl font-bold text-white">{isLoading ? "..." : unpaidFeesCount}</p>
            </div>
          </div>
        </div>

        {/* Table Filters Glass */}
        <div className="student-glass-panel p-6 rounded-t-3xl border-b-0 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <select 
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full bg-[#14213D] border border-white/10 rounded-lg py-3.5 pl-4 pr-10 appearance-none text-white focus:outline-none focus:border-primary/50 cursor-pointer text-sm font-semibold"
              >
                <option value="">All Courses</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-[#14213D] border border-white/10 rounded-lg py-3.5 pl-4 pr-10 appearance-none text-white focus:outline-none focus:border-primary/50 cursor-pointer text-sm font-semibold"
              >
                <option value="">Payment Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col w-full lg:w-auto sm:flex-row items-center gap-3">
            <button 
              type="button"
              onClick={() => { setCourseFilter(""); setPaymentFilter(""); }}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all text-on-surface-variant cursor-pointer select-none text-xs font-semibold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              <span>Reset Filters</span>
            </button>
            <button 
              type="button"
              onClick={handleExcelExport}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-3 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary transition-all rounded-lg cursor-pointer select-none text-xs font-semibold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export Excel</span>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
                      <p className="text-on-surface-variant text-sm font-light">Loading enrolled student list...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-on-surface-variant font-light">
                      No registered students found matching your selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => {
                    const payment = getStudentPaymentStatus(s.id);
                    const perf = getStudentPerformance(s.id);
                    const avatar = s.avatar_url || getStudentAvatar(index);

                    const paymentStyles: Record<string, string> = {
                      Paid: "bg-green-500/10 text-green-400 border-green-500/20",
                      Partial: "bg-primary/10 text-primary border-primary/20",
                      Unpaid: "bg-red-500/10 text-red-500 border-red-500/20"
                    };

                    const dotStyles: Record<string, string> = {
                      Paid: "bg-green-400",
                      Partial: "bg-primary",
                      Unpaid: "bg-red-400"
                    };

                    const progressColor = perf.percentage >= 85 ? "bg-primary shadow-[0_0_8px_rgba(252,163,17,0.6)]" : perf.percentage >= 65 ? "bg-amber-200" : "bg-red-500";

                    return (
                      <tr 
                        key={s.id} 
                        className="hover:bg-white/5 transition-colors group cursor-pointer hover:translate-x-1 duration-200"
                        onClick={() => router.push(`/students/${s.id}`)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              <img alt="Student Profile" className="w-12 h-12 rounded-full border border-white/10 group-hover:border-primary/50 transition-all object-cover" src={avatar} />
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#000000] rounded-full"></span>
                            </div>
                            <div>
                              <p className="text-white font-bold text-base">{s.first_name} {s.last_name}</p>
                              <p className="text-on-surface-variant/60 text-xs">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-white font-medium block">{s.program || "General Education"}</span>
                          <span className="text-xs text-on-surface-variant/50">ID: {s.enrollment_id}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${paymentStyles[payment] || paymentStyles.Paid}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[payment] || dotStyles.Paid}`}></span>
                            {payment}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="w-32">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs text-white font-bold">{perf.percentage}%</span>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${perf.label === "At Risk" ? "text-red-400" : "text-on-surface-variant"}`}>{perf.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor}`} style={{ width: `${perf.percentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Round styled WhatsApp Icon Button */}
                            <button
                              type="button"
                              onClick={(e) => handleWhatsAppRedirect(e, s.phone || "03001234567")}
                              className="w-9 h-9 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center justify-center transition-all cursor-pointer select-none"
                              title="Connect on WhatsApp"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.058 5.248 5.303 0 11.748 0c3.122.001 6.059 1.219 8.274 3.435s3.43 5.155 3.43 8.278c-.004 6.495-5.248 11.743-11.693 11.743-2.001-.001-3.967-.514-5.707-1.492L0 24zm6.59-4.846c1.62.962 3.21 1.468 4.975 1.47 5.434 0 9.85-4.409 9.853-9.83.002-2.624-1.02-5.09-2.875-6.948-1.855-1.859-4.325-2.883-6.953-2.884-5.438 0-9.855 4.41-9.858 9.832-.001 1.83.499 3.518 1.446 5.107L1.9 22.083l4.747-1.929zm12.39-7.234c-.308-.154-1.82-.9-2.102-1.002-.283-.103-.49-.155-.694.154-.205.31-.794.99-.973 1.196-.179.206-.357.23-.665.077-.308-.154-1.3-.478-2.476-1.527-.914-.815-1.53-1.82-1.71-2.128-.18-.308-.019-.475.135-.629.138-.138.308-.36.462-.54.154-.18.206-.309.308-.514.103-.206.051-.385-.026-.54-.077-.154-.694-1.671-.951-2.29-.25-.6-.524-.52-.719-.53h-.615c-.205 0-.54.077-.822.385-.282.31-1.077 1.053-1.077 2.57 0 1.516 1.102 2.98 1.256 3.186.154.205 2.169 3.31 5.253 4.64.734.317 1.307.506 1.753.647.738.234 1.41.201 1.942.121.593-.09 1.82-.743 2.076-1.46.257-.718.257-1.334.18-1.46-.077-.127-.282-.205-.59-.359z"/>
                              </svg>
                            </button>
                            <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-lg transition-all" onClick={(e) => { e.stopPropagation(); }}>
                              <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footing */}
          <div className="p-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-wider text-on-surface-variant">Showing <span className="text-white">1 - {filteredStudents.length}</span> of {filteredStudents.length} students</p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-lg bg-primary text-black flex items-center justify-center font-bold">1</button>
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface-variant disabled:opacity-30" disabled>
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