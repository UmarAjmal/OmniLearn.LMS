"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

interface Lead {
  id: number;
  campaign_id: number;
  student_id: number;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  platform: string;
  lead_quality: number;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  campaign_title: string;
}

export default function LeadsReviewPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [points, setPoints] = useState(10);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await apiClient("/api/leads?status=pending");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient(`/api/leads/${selectedLead.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          feedback,
          points_awarded: reviewStatus === 'approved' ? points : 0
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted!");
        setSelectedLead(null);
        fetchLeads(); // refresh
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Lead Review Pipeline</h1>
        <p className="text-sm text-white/50 mt-1">Review student submissions, provide feedback, and award points.</p>
      </div>

      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl overflow-hidden">
        {isLoading ? (
           <div className="flex items-center justify-center h-64">
             <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
           </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">fact_check</span>
            <p className="text-white/40">No pending leads to review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="text-white/40 border-b border-white/5">
                  <th className="font-medium p-4">Business & Campaign</th>
                  <th className="font-medium p-4">Student</th>
                  <th className="font-medium p-4">Contact Info</th>
                  <th className="font-medium p-4">Quality</th>
                  <th className="font-medium p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map(lead => (
                  <tr key={lead.id} className="text-white/70 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white mb-1">{lead.business_name}</div>
                      <div className="text-xs text-white/40 flex items-center gap-1">
                        <span className="bg-[#F6B32B]/10 text-[#F6B32B] px-1.5 py-0.5 rounded">{lead.platform}</span>
                        {lead.campaign_title}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </div>
                        <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs space-y-1">
                      {lead.email && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {lead.email}</div>}
                      {lead.phone && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">call</span> {lead.phone}</div>}
                      {lead.website && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">language</span> <a href={lead.website} target="_blank" className="text-blue-400 hover:underline">Link</a></div>}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={`material-symbols-outlined text-[14px] ${star <= lead.lead_quality ? 'text-[#F6B32B]' : 'text-white/10'}`} style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#101827] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-bold text-white">Review Lead</h2>
                <p className="text-sm text-white/50">{selectedLead.business_name} by {selectedLead.first_name}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-white/50 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="reviewForm" onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Decision</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${reviewStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                      <input type="radio" name="status" value="approved" checked={reviewStatus === 'approved'} onChange={() => setReviewStatus('approved')} className="hidden" />
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                      <span className="font-bold">Approve</span>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${reviewStatus === 'rejected' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                      <input type="radio" name="status" value="rejected" checked={reviewStatus === 'rejected'} onChange={() => setReviewStatus('rejected')} className="hidden" />
                      <span className="material-symbols-outlined text-3xl">cancel</span>
                      <span className="font-bold">Reject</span>
                    </label>
                  </div>
                </div>

                {reviewStatus === 'approved' && (
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Points to Award</label>
                    <input 
                      type="number" 
                      value={points} 
                      onChange={e => setPoints(Number(e.target.value))} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B] outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Feedback (Optional)</label>
                  <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#F6B32B] outline-none h-24"
                    placeholder="Provide constructive feedback..."
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
              <button onClick={() => setSelectedLead(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                form="reviewForm"
                disabled={isSubmitting}
                className="bg-[#F6B32B] hover:bg-[#E09B18] text-black px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
