"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

interface Campaign {
  id: number;
  title: string;
  description: string;
  platforms: string[];
  priority: string;
  status: string;
  deadline: string;
}

export default function StudentCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyCampaigns();
  }, []);

  const fetchMyCampaigns = async () => {
    try {
      // First get student ID
      const meRes = await apiClient("/api/users/me");
      const meJson = await meRes.json();
      if (!meJson.success || !meJson.data?.student_id) {
        toast.error("Could not find student profile");
        setIsLoading(false);
        return;
      }
      
      const res = await apiClient(`/api/student/${meJson.data.student_id}/campaigns`);
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Error fetching campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Assigned Campaigns</h1>
        <p className="text-sm text-white/50 mt-1">Select a campaign to view details and start hunting leads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-full bg-[#101827] border border-white/[0.06] rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">radar</span>
            <p className="text-white/40">You have no active campaigns assigned.</p>
          </div>
        ) : (
          campaigns.map(camp => (
            <Link 
              key={camp.id} 
              href={`/student/campaigns/${camp.id}`}
              className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(camp.priority)}`}>
                  {camp.priority || 'Normal'}
                </span>
                {camp.status === 'active' && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F6B32B] transition-colors">{camp.title}</h3>
              <p className="text-sm text-white/50 line-clamp-2 mb-6 flex-1">{camp.description || "No description provided."}</p>
              
              <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/[0.06] pt-4 mt-auto">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  {new Date(camp.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-[#F6B32B] font-bold">
                  Start Hunting <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
