"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

interface FeePayment {
  id: number;
  amount: string | number;
  payment_method: string;
  transaction_reference?: string;
  receipt_number: string;
  remarks: string;
  payment_date: string;
}

interface FeeData {
  id: number;
  total_fee: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  status: string;
}

export default function StudentFeesPage() {
  const router = useRouter();
  const [fee, setFee] = useState<FeeData | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  const fetchFeeData = useCallback(async (studentId: number) => {
    try {
      const res = await apiClient(`/api/student/${studentId}/fees`);
      const json = await res.json();
      if (json.success) {
        setFee(json.data.fee);
        setPayments(json.data.payments || []);
      } else {
        toast.error(json.error || "Failed to load fee information.");
      }
    } catch {
      toast.error("Failed to load fee information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const infoStr = localStorage.getItem("lms_student_info");
    if (!infoStr || infoStr === "undefined" || infoStr === "null") {
      router.push("/login/student");
      return;
    }
    try {
      const student = JSON.parse(infoStr);
      if (student && student.id) {
        setStudentInfo(student);
        fetchFeeData(student.id);
      } else {
        router.push("/login/student");
      }
    } catch {
      router.push("/login/student");
    }
  }, [fetchFeeData, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "partial": return "bg-[#F6B32B]/15 text-[#F6B32B border-[#F6B32B]/20";
      case "course_not_assigned": return "bg-red-500/15 text-red-400 border-red-500/20";
      case "fee_not_configured": return "bg-red-500/15 text-red-400 border-red-500/20";
      default: return "bg-red-500/15 text-red-400 border-red-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Fully Paid";
      case "partial": return "Partially Paid";
      case "course_not_assigned": return "No Course Assigned";
      case "fee_not_configured": return "Fee Not Configured";
      default: return "Unpaid";
    }
  };

  const printReceipt = (payment: FeePayment) => {
    setReceiptToPrint(payment);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
      </div>
    );
  }

  const total = Number(fee?.total_fee || 0);
  const paid = Number(fee?.paid_amount || 0);
  const progressPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const statusStr = fee?.status || "unpaid";
  
  // Find last payment date if there are payments
  const lastPayment = payments.length > 0 ? payments[0].payment_date : null;

  return (
    <div className="relative text-xs font-sans text-white/90">
      <style dangerouslySetInnerHTML={{__html: `
        .glacier-card {
          background: rgba(10, 20, 38, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-area, .receipt-print-area * {
            visibility: visible;
          }
          .receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Print Receipt Section */}
      {receiptToPrint && studentInfo && (
        <div className="receipt-print-area text-black font-sans bg-white p-8 max-w-2xl mx-auto border-2 border-black/10 shadow-none">
          <div className="text-center mb-8 border-b-2 border-black/10 pb-6">
            <h1 className="text-3xl font-extrabold text-black">Falcon Swift</h1>
            <p className="text-sm text-black/60">Enterprise Software House & Academy</p>
            <h2 className="text-xl font-bold mt-4 uppercase tracking-widest text-black/80">Fee Receipt</h2>
          </div>
          
          <div className="flex justify-between mb-8 text-sm">
            <div>
              <p><span className="font-bold">Receipt No:</span> {receiptToPrint.receipt_number}</p>
              <p><span className="font-bold">Date:</span> {new Date(receiptToPrint.payment_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Student:</span> {studentInfo.first_name} {studentInfo.last_name}</p>
              <p><span className="font-bold">Reg No:</span> {studentInfo.enrollment_id || "N/A"}</p>
              <p><span className="font-bold">Course:</span> {studentInfo.program || "N/A"}</p>
            </div>
          </div>
          
          <table className="w-full text-left mb-8 text-sm">
            <thead>
              <tr className="border-y-2 border-black/10">
                <th className="py-2">Description</th>
                <th className="py-2">Method</th>
                <th className="py-2 text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4">Course Fee Payment</td>
                <td className="py-4">{receiptToPrint.payment_method} {receiptToPrint.transaction_reference ? `(${receiptToPrint.transaction_reference})` : ""}</td>
                <td className="py-4 text-right font-bold text-lg">{receiptToPrint.amount}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="border-t-2 border-black/10 pt-4 flex justify-between text-xs text-black/60">
            <p>Generated by OmniLearn LMS</p>
            <p>Signature: ______________________</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Fees</h1>
          <p className="text-sm text-white/50 mt-1">Track your course fee status and payment history.</p>
        </div>
      </div>

      {!fee ? (
        <div className="glacier-card rounded-2xl p-8 text-center border-white/5 flex flex-col items-center justify-center min-h-[300px] no-print">
          <span className="material-symbols-outlined text-6xl text-white/10 mb-4">account_balance_wallet</span>
          <p className="text-white/40 text-lg">No fee record found for your account.</p>
        </div>
      ) : (
        <div className="space-y-6 no-print">
          {/* Top Status Card */}
          <div className="glacier-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F6B32B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex-1 space-y-2 relative z-10 w-full">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Current Status</p>
              <div className="flex flex-col gap-2">
                <div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(statusStr)}`}>
                    {getStatusLabel(statusStr)}
                  </span>
                </div>
                {lastPayment && (
                  <p className="text-xs text-white/50 mt-2">
                    <span className="font-bold text-white/70">Last Payment:</span> {new Date(lastPayment).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row justify-around w-full md:w-auto gap-8 relative z-10">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Fee</span>
                <span className="text-2xl font-bold text-white">{fee.total_fee === null ? 'Not Configured' : `Rs. ${fee.total_fee}`}</span>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Paid</span>
                <span className="text-2xl font-bold text-emerald-400">{fee.paid_amount === null ? '—' : `Rs. ${fee.paid_amount}`}</span>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Remaining</span>
                <span className="text-2xl font-bold text-red-400">{fee.remaining_amount === null ? '—' : `Rs. ${fee.remaining_amount}`}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="glacier-card rounded-2xl p-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Fee Progress</span>
              <span className="text-sm font-bold text-emerald-400">{Math.round(progressPct)}% Paid</span>
            </div>
            <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* History */}
          <div className="glacier-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#F6B32B]">history</span>
                Payment History
              </h3>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40 border-b border-white/[0.04]">
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Method</th>
                    <th className="pb-3 px-2">Receipt / Ref</th>
                    <th className="pb-3 px-2">Remarks</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-2 text-white/70">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="py-4 px-2 font-bold text-emerald-400">Rs. {p.amount}</td>
                      <td className="py-4 px-2 text-white/70">{p.payment_method}</td>
                      <td className="py-4 px-2 text-white/40 text-[11px]">{p.receipt_number || "—"}</td>
                      <td className="py-4 px-2 text-[#F6B32B]/80 text-[11px] italic">{p.remarks || "—"}</td>
                      <td className="py-4 px-2 text-center">
                        <button 
                          onClick={() => printReceipt(p)}
                          className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors mx-auto"
                          title="Download/Print Receipt"
                        >
                          <span className="material-symbols-outlined text-sm">print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/30">No payments recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
