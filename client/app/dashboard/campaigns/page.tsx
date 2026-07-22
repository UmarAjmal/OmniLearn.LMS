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
  start_date: string;
  deadline: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await apiClient("/api/campaigns");
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      } else {
        toast.error(json.error || "Failed to fetch campaigns");
      }
    } catch {
      toast.error("An error occurred while fetching campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (p?: string | null) => {
    if (!p) return 'text-white/70 bg-white/5 border-white/10';
    switch (p.toLowerCase()) {
      case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  const getStatusColor = (s?: string | null) => {
    if (!s) return 'text-white/70 bg-white/5 border-white/10';
    switch (s.toLowerCase()) {
      case 'active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'completed': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'expired': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'draft': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Lead Campaigns</h1>
          <p className="text-sm text-white/50 mt-1">Manage business development campaigns and target leads.</p>
        </div>
        <Link
          href="/dashboard/campaigns/create"
          className="bg-gradient-to-r from-[#F6B32B] to-[#E09B18] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-[#F6B32B]/20"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {campaigns.length === 0 ? (
          <div className="col-span-full bg-[#101827] border border-white/[0.06] rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">radar</span>
            <p className="text-white/40">No campaigns found. Create one to get started.</p>
          </div>
        ) : (
          campaigns.map(camp => (
            <Link 
              key={camp.id} 
              href={`/dashboard/campaigns/${camp.id}`}
              className="bg-[#101827] border border-white/[0.06] rounded-2xl p-5 hover:border-white/20 transition-all hover:-translate-y-1 flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(camp.status)}`}>
                  {camp.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(camp.priority)}`}>
                  {camp.priority}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#F6B32B] transition-colors line-clamp-1">{camp.title}</h3>
              <p className="text-xs text-white/50 line-clamp-2 mb-4 flex-1">{camp.description || "No description provided."}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {(camp.platforms || []).slice(0, 3).map((p: string) => (
                  <span key={p} className="px-2 py-1 bg-white/5 text-white/70 text-[10px] rounded border border-white/10">{p}</span>
                ))}
                {(camp.platforms || []).length > 3 && (
                  <span className="px-2 py-1 bg-white/5 text-white/70 text-[10px] rounded border border-white/10">+{camp.platforms.length - 3}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40 border-t border-white/[0.06] pt-3 mt-auto">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  {new Date(camp.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-[#F6B32B]">
                  View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
