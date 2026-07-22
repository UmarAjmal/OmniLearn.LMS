"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      // Fetch Campaign Data
      const res = await apiClient(`/api/campaigns/${id}`);
      const json = await res.json();
      if (json.success) {
        setCampaign(json.data);
      } else {
        toast.error(json.error || "Failed to load campaign");
      }

      // Fetch Leads for this campaign
      const leadsRes = await apiClient(`/api/leads?campaign_id=${id}`);
      const leadsJson = await leadsRes.json();
      if (leadsJson.success) {
        setLeads(leadsJson.data || []);
      }
    } catch {
      toast.error("Error loading campaign details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await apiClient(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Campaign marked as ${status}`);
        fetchCampaignDetails();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!campaign) return <div className="text-white/50 p-8 text-center">Campaign not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns" className="text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{campaign.title}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                campaign.status === 'active' ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' : 
                campaign.status === 'completed' ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : 
                'text-gray-400 border-gray-500/50 bg-gray-500/10'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1">Target: {campaign.target_leads} leads | Deadline: {new Date(campaign.deadline).toLocaleDateString()}</p>
          </div>
          
          {campaign.status === 'active' && (
            <button 
              onClick={() => handleUpdateStatus('completed')}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-colors"
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Description & Instructions</h2>
            <p className="text-white/70 text-sm mb-6 leading-relaxed whitespace-pre-wrap">{campaign.description || "No description provided."}</p>
            
            {campaign.instructions && (
              <div className="bg-[#F6B32B]/10 border border-[#F6B32B]/20 rounded-xl p-4">
                <h3 className="text-[#F6B32B] font-bold text-sm flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  Hunting Instructions
                </h3>
                <p className="text-[#F6B32B]/80 text-sm whitespace-pre-wrap">{campaign.instructions}</p>
              </div>
            )}
          </div>

          {/* Submissions */}
          <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h2 className="text-lg font-bold text-white">Lead Submissions</h2>
              <span className="bg-white/10 text-white px-2 py-1 rounded-full text-xs font-bold">{leads.length} total</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/5">
                    <th className="font-medium p-3">Business</th>
                    <th className="font-medium p-3">Student</th>
                    <th className="font-medium p-3">Contact</th>
                    <th className="font-medium p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map(lead => (
                    <tr key={lead.id} className="text-white/70 hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-bold text-white">{lead.business_name}</div>
                        <div className="text-xs text-white/40">{lead.platform}</div>
                      </td>
                      <td className="p-3">{lead.first_name} {lead.last_name}</td>
                      <td className="p-3 text-xs">
                        <div>{lead.email}</div>
                        <div>{lead.phone}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          lead.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          lead.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-white/40">No leads submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Targets */}
          <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Target Data</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-white/40 uppercase mb-1">Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {campaign.keywords?.map((k: any) => (
                    <span key={k.id} className="bg-white/5 text-white/70 border border-white/10 px-2 py-1 rounded text-xs">{k.keyword}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-white/40 uppercase mb-1">Platforms</span>
                <div className="flex flex-wrap gap-1">
                  {(campaign.platforms || []).map((p: string) => (
                    <span key={p} className="bg-[#F6B32B]/10 text-[#F6B32B] border border-[#F6B32B]/20 px-2 py-1 rounded text-xs">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Students */}
          <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h2 className="text-lg font-bold text-white">Assigned Team</h2>
              <span className="text-xs text-white/40">{campaign.students?.length || 0} students</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {campaign.students?.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center bg-white/5 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-bold text-white">{s.first_name} {s.last_name}</div>
                    <div className="text-[10px] text-white/40">{s.enrollment_id}</div>
                  </div>
                </div>
              ))}
              {(!campaign.students || campaign.students.length === 0) && (
                <div className="text-sm text-white/40 text-center py-4">No students assigned.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
