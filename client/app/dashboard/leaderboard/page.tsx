"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

interface LeaderboardEntry {
  student_id: number;
  first_name: string;
  last_name: string;
  enrollment_id: string;
  total_points: number;
  approved_leads: number;
  rejected_leads: number;
  total_submissions: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);

  // View state
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("lms_user_role");
    setUserRole(role);
    
    if (role === "student") {
      try {
        const studentInfoStr = localStorage.getItem("lms_student_info");
        if (studentInfoStr) {
          const info = JSON.parse(studentInfoStr);
          setStudentId(info.id);
        }
      } catch (e) {
        console.error("Failed to parse student info", e);
      }
    }
    
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient("/api/reports/leaderboard");
      const json = await res.json();
      if (json.success) {
        setLeaderboard(json.data || []);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Find current student stats if role is student
  const studentIndex = leaderboard.findIndex(e => e.student_id === studentId);
  const myStats = studentIndex !== -1 ? leaderboard[studentIndex] : null;
  const myRank = studentIndex !== -1 ? studentIndex + 1 : null;

  // Determine which entries to show
  const displayLimit = showAll ? leaderboard.length : 10;
  const displayedLeaderboard = leaderboard.slice(0, displayLimit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#F6B32B]">social_leaderboard</span>
            Hunters Leaderboard
          </h1>
          <p className="text-sm text-white/50 mt-1">Top performing students based on approved leads and awarded points.</p>
        </div>
        
        {(userRole === "admin" || userRole === "trainer") && leaderboard.length > 10 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 text-sm font-bold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showAll ? 'expand_less' : 'expand_more'}
            </span>
            {showAll ? 'Show Top 10 Only' : 'View All Rankings'}
          </button>
        )}
      </div>

      {userRole === "student" && myStats && (
        <div className="bg-gradient-to-r from-[#101827] to-[#1a2234] border border-[#F6B32B]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F6B32B] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <h2 className="text-sm font-bold text-[#F6B32B] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person</span>
            My Performance
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Current Rank</div>
              <div className="text-3xl font-black text-white">#{myRank}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Total Points</div>
              <div className="text-3xl font-black text-[#F6B32B]">{myStats.total_points}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Approved Leads</div>
              <div className="text-3xl font-black text-emerald-400">{myStats.approved_leads}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Total Leads</div>
              <div className="text-3xl font-black text-white">{myStats.total_submissions}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 md:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#F6B32B]/30 border-t-[#F6B32B] rounded-full animate-spin"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-white/10 mb-4">emoji_events</span>
            <p className="text-white/40">No leaderboard data available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedLeaderboard.map((entry, index) => {
              const isMe = userRole === "student" && entry.student_id === studentId;
              
              return (
                <div 
                  key={entry.student_id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isMe ? 'bg-[#F6B32B]/10 border-[#F6B32B]/50 shadow-[0_0_15px_rgba(246,179,43,0.15)] relative overflow-hidden' :
                    index === 0 ? 'bg-gradient-to-r from-[#F6B32B]/20 to-transparent border-[#F6B32B]/40 shadow-[0_0_15px_rgba(246,179,43,0.1)]' : 
                    index === 1 ? 'bg-white/[0.04] border-white/20' : 
                    index === 2 ? 'bg-white/[0.02] border-white/10' : 
                    'bg-transparent border-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  {isMe && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F6B32B]"></div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                      index === 0 && !isMe ? 'bg-[#F6B32B] text-black shadow-lg shadow-[#F6B32B]/30' : 
                      index === 1 && !isMe ? 'bg-gray-300 text-gray-800' : 
                      index === 2 && !isMe ? 'bg-[#CD7F32] text-white' : 
                      isMe ? 'bg-[#F6B32B] text-black shadow-lg shadow-[#F6B32B]/30' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className={`font-bold flex items-center gap-2 ${
                        index === 0 || isMe ? 'text-[#F6B32B] text-lg' : 'text-white'
                      }`}>
                        {entry.first_name} {entry.last_name}
                        {isMe && (
                          <span className="px-1.5 py-0.5 bg-[#F6B32B] text-black text-[9px] font-black uppercase tracking-wider rounded">You</span>
                        )}
                      </div>
                      <div className="text-xs text-white/40">{entry.enrollment_id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right">
                    <div className="hidden md:block">
                      <div className="text-sm font-bold text-emerald-400">{entry.approved_leads} Approved</div>
                      <div className="text-xs text-white/30">{entry.total_submissions} Total</div>
                    </div>
                    <div className="min-w-[80px]">
                      <div className={`font-black text-2xl ${index === 0 || isMe ? 'text-[#F6B32B]' : 'text-white'}`}>
                        {entry.total_points}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
