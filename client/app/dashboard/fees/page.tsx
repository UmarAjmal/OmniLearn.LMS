"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";

interface FeePayment {
  id: number;
  amount: string | number;
  payment_method: string;
  transaction_reference: string;
  receipt_number: string;
  remarks: string;
  payment_date: string;
  recorded_by: number;
}

interface FeeRecord {
  student_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  course: string;
  email: string;
  phone: string;
  fee_status: string;
  total_fee: string | number;
  paid_amount: string | number;
  remaining_amount: string | number;
  last_payment_date: string | null;
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [filtered, setFiltered] = useState<FeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [activeStudent, setActiveStudent] = useState<FeeRecord | null>(null);
  const [studentPayments, setStudentPayments] = useState<FeePayment[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Form State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  const [receiptToPrint, setReceiptToPrint] = useState<FeePayment | null>(null);

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient(`/api/finance/fees`);
      const json = await res.json();
      if (json.success) {
        setFees(json.data || []);
        setFiltered(json.data || []);
      }
    } catch {
      toast.error("Failed to load fees.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  useEffect(() => {
    let temp = fees;
    if (search.trim()) {
      const q = search.toLowerCase();
      temp = temp.filter(f =>
        f.first_name?.toLowerCase().includes(q) ||
        f.last_name?.toLowerCase().includes(q) ||
        f.enrollment_id?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      temp = temp.filter(f => f.fee_status === statusFilter);
    }
    setFiltered(temp);
  }, [search, statusFilter, fees]);

  const openStudentModal = async (student: FeeRecord) => {
    setActiveStudent(student);
    setIsModalLoading(true);
    setStudentPayments([]);
    setPayAmount("");
    setPayMethod("Cash");
    setPayRef("");
    setPayRemarks("");
    try {
      const res = await apiClient(`/api/finance/fees/${student.student_id}`);
      const json = await res.json();
      if (json.success) {
        setStudentPayments(json.data.payments || []);
      }
    } catch {
      toast.error("Failed to load payment history.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const closeStudentModal = () => {
    setActiveStudent(null);
  };

  const handleUpdateTotalFee = async () => {
    if (!activeStudent) return;
    const newTotal = window.prompt("Enter new Total Course Fee for " + activeStudent.first_name + ":", String(activeStudent.total_fee));
    if (newTotal === null) return;
    const num = parseFloat(newTotal);
    if (isNaN(num) || num < 0) {
      toast.error("Invalid total fee entered.");
      return;
    }
    
    setIsUpdatingFee(true);
    try {
      const res = await apiClient(`/api/finance/fees/${activeStudent.student_id}/total`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ totalFee: num })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Total fee updated successfully!");
        setActiveStudent({ ...activeStudent, ...json.data });
        fetchFees();
      } else {
        toast.error(json.error || "Failed to update total fee.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handlePayment = async () => {
    if (!activeStudent) return;
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setIsPaying(true);
    try {
      const res = await apiClient(`/api/finance/fees/${activeStudent.student_id}/pay`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          transactionReference: payRef,
          remarks: payRemarks,
          totalFee: activeStudent.total_fee
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment recorded successfully!");
        fetchFees();
        closeStudentModal();
      } else {
        toast.error(json.error || "Failed to record payment.");
      }
    } catch {
      toast.error("Network error while recording payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Student ID", "First Name", "Last Name", "Enrollment ID", "Course", "Email", "Phone", "Status", "Total Fee", "Paid", "Remaining", "Last Payment"];
    const rows = filtered.map(f => [
      f.student_id, f.first_name, f.last_name, f.enrollment_id, f.course, f.email, f.phone, f.fee_status, f.total_fee, f.paid_amount, f.remaining_amount, f.last_payment_date || "N/A"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Fee_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReceipt = (payment: FeePayment) => {
    setReceiptToPrint(payment);
    setTimeout(() => {
      window.print();
      setReceiptToPrint(null);
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-500/15 text-emerald-400";
      case "partial": return "bg-[#F6B32B]/15 text-[#F6B32B]";
      case "course_not_assigned": return "bg-red-500/15 text-red-400";
      case "fee_not_configured": return "bg-red-500/15 text-red-400";
      default: return "bg-red-500/15 text-red-400";
    }
  };

  const formatStatus = (status: string) => {
    if (status === 'course_not_assigned') return 'No Course';
    if (status === 'fee_not_configured') return 'No Fee';
    return status;
  };

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

      {receiptToPrint && activeStudent && (
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
              <p><span className="font-bold">Student:</span> {activeStudent.first_name} {activeStudent.last_name}</p>
              <p><span className="font-bold">Reg No:</span> {activeStudent.enrollment_id}</p>
              <p><span className="font-bold">Course:</span> {activeStudent.course}</p>
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Fee Management</h1>
          <p className="text-sm text-white/50 mt-1">Track payments, manage balances, and record transactions.</p>
        </div>
      </div>

      <div className="glacier-card rounded-2xl overflow-hidden mb-6 flex flex-col md:flex-row gap-4 p-4 no-print">
        <input
          type="text"
          placeholder="Search by name, reg #, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-[#F6B32B]/50 focus:outline-none transition-all text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B]/50 focus:outline-none transition-all text-sm appearance-none"
        >
          <option value="all" className="bg-[#0a1426]">All Statuses</option>
          <option value="paid" className="bg-[#0a1426]">Paid</option>
          <option value="partial" className="bg-[#0a1426]">Partial</option>
          <option value="unpaid" className="bg-[#0a1426]">Unpaid</option>
        </select>
        <button 
          onClick={exportCSV}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 no-print">
          <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glacier-card rounded-2xl overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <th className="p-4">Student</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Fee</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((fee) => (
                  <tr key={fee.student_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{fee.first_name} {fee.last_name}</div>
                      <div className="text-white/40 text-[11px]">{fee.enrollment_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white/70">{fee.email}</div>
                      <div className="text-white/40">{fee.phone || "—"}</div>
                    </td>
                    <td className="p-4 text-white/70">{fee.course || "—"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(fee.fee_status)}`}>
                        {formatStatus(fee.fee_status)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{fee.total_fee === null ? '—' : `Rs. ${fee.total_fee}`}</td>
                    <td className="p-4 font-bold text-emerald-400">{fee.paid_amount === null ? '—' : `Rs. ${fee.paid_amount}`}</td>
                    <td className="p-4 font-bold text-red-400">{fee.remaining_amount === null ? '—' : `Rs. ${fee.remaining_amount}`}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => openStudentModal(fee)}
                        className="px-3 py-1.5 bg-[#F6B32B]/10 hover:bg-[#F6B32B]/20 text-[#F6B32B] rounded-lg text-xs font-bold transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/40">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment & History Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-[#0a1426] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl relative my-auto max-h-[95vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Fee Details: {activeStudent.first_name} {activeStudent.last_name}
                </h3>
                <p className="text-xs text-[#F6B32B] mt-0.5">{activeStudent.enrollment_id} • {activeStudent.course}</p>
              </div>
              <button onClick={closeStudentModal} className="text-white/50 hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Left Column - Add Payment */}
              <div className="w-full md:w-1/3 border-r border-white/5 p-6 overflow-y-auto bg-white/[0.01]">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Record Payment</h4>
                
                {activeStudent.fee_status === 'course_not_assigned' || activeStudent.fee_status === 'fee_not_configured' ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-red-400 text-3xl mb-2">warning</span>
                    <p className="text-red-400 font-bold text-sm mb-1">{activeStudent.fee_status === 'course_not_assigned' ? 'Course Not Assigned' : 'Fee Not Configured'}</p>
                    <p className="text-white/60 text-xs">Please assign a total fee before recording payments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Amount (Rs.)</label>
                      <input 
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-[#101827] border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-bold focus:border-[#F6B32B] focus:outline-none transition-colors"
                        placeholder="e.g. 5000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Payment Method</label>
                      <select 
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full bg-[#101827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Transaction Ref / Cheque #</label>
                      <input 
                        type="text"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full bg-[#101827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B] focus:outline-none transition-colors text-sm"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Remarks</label>
                      <textarea 
                        value={payRemarks}
                        onChange={(e) => setPayRemarks(e.target.value)}
                        rows={2}
                        className="w-full bg-[#101827] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B] focus:outline-none transition-colors text-sm resize-none custom-scrollbar"
                        placeholder="Any notes..."
                      />
                    </div>

                    <button 
                      onClick={handlePayment}
                      disabled={isPaying}
                      className="w-full mt-2 bg-[#F6B32B] hover:bg-[#F6B32B]/90 text-black font-bold text-sm py-3 rounded-xl shadow-[0_0_15px_rgba(246,179,43,0.3)] transition-all flex justify-center items-center gap-2"
                    >
                      {isPaying ? "Recording..." : "Save Payment"}
                    </button>
                    
                    <p className="text-[10px] text-center text-white/30 italic">Receipt number will be auto-generated.</p>
                  </div>
                )}
              </div>

              {/* Right Column - History & Summary */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto flex flex-col gap-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center text-center relative group">
                    <button 
                      onClick={handleUpdateTotalFee}
                      disabled={isUpdatingFee}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/10 hover:bg-white/20 w-6 h-6 rounded flex items-center justify-center transition-all"
                      title="Edit Total Fee"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Fee</span>
                    <span className="text-xl font-bold text-white">{activeStudent.total_fee === null ? 'Not Configured' : `Rs. ${activeStudent.total_fee}`}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Paid Amount</span>
                    <span className="text-xl font-bold text-emerald-400">{activeStudent.paid_amount === null ? '—' : `Rs. ${activeStudent.paid_amount}`}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Remaining</span>
                    <span className="text-xl font-bold text-red-400">{activeStudent.remaining_amount === null ? '—' : `Rs. ${activeStudent.remaining_amount}`}</span>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Payment History</h4>
                  </div>
                  <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-black/20 p-4">
                    {isModalLoading ? (
                      <div className="text-center text-white/30 text-sm mt-10">Loading history...</div>
                    ) : studentPayments.length === 0 ? (
                      <div className="text-center text-white/30 text-sm mt-10">No payments recorded yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {studentPayments.map((p) => (
                          <div key={p.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition-colors">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-emerald-400 mb-1">Rs. {p.amount}</div>
                              <div className="flex items-center gap-3 text-[11px] text-white/40">
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">calendar_today</span> {new Date(p.payment_date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">payments</span> {p.payment_method}</span>
                              </div>
                              <div className="text-[10px] text-white/50 mt-1.5 flex gap-3">
                                {p.receipt_number && <span className="bg-white/5 px-2 py-0.5 rounded">Receipt: {p.receipt_number}</span>}
                                {p.transaction_reference && <span className="bg-white/5 px-2 py-0.5 rounded">Ref: {p.transaction_reference}</span>}
                              </div>
                              {p.remarks && <div className="text-[11px] text-[#F6B32B]/80 mt-1.5 italic">"{p.remarks}"</div>}
                            </div>
                            <button 
                              onClick={() => printReceipt(p)}
                              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
                              title="Print Receipt"
                            >
                              <span className="material-symbols-outlined text-lg">print</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
