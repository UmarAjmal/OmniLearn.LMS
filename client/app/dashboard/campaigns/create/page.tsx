"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [targetBatch, setTargetBatch] = useState("");
  const [targetTrainer, setTargetTrainer] = useState("");
  const [targetLeads, setTargetLeads] = useState<number>(100);
  const [dailyTarget, setDailyTarget] = useState<number>(10);
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  
  // Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  // Targets
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const availablePlatforms = ["Google Maps", "LinkedIn", "Facebook", "Instagram", "Yellow Pages", "Company Websites"];

  useEffect(() => {
    // Fetch students to assign
    apiClient("/api/students")
      .then(r => r.json())
      .then(json => {
        if (json.success) setAvailableStudents(json.data || []);
      })
      .catch(() => console.error("Failed to load students"));
  }, []);

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const togglePlatform = (plat: string) => {
    if (platforms.includes(plat)) setPlatforms(platforms.filter(p => p !== plat));
    else setPlatforms([...platforms, plat]);
  };

  const toggleStudent = (id: number) => {
    if (selectedStudents.includes(id)) setSelectedStudents(selectedStudents.filter(s => s !== id));
    else setSelectedStudents([...selectedStudents, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) {
      toast.error("Please fill all required fields");
      return;
    }
    if (keywords.length === 0) {
      toast.error("Please add at least one keyword");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, platforms,
          target_batch: targetBatch,
          target_trainer: targetTrainer,
          target_leads: targetLeads,
          daily_target: dailyTarget,
          priority,
          start_date: startDate || new Date().toISOString(),
          deadline, instructions,
          keywords,
          student_ids: selectedStudents
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Campaign created successfully!");
        router.push("/dashboard/campaigns");
      } else {
        toast.error(json.error || "Failed to create campaign");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns" className="text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Campaign</h1>
          <p className="text-sm text-white/50 mt-1">Configure target audience, keywords, and assignments.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 md:p-8 space-y-8">
        
        {/* Core Details */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Core Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Campaign Name *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B] transition-colors"
                placeholder="e.g. AI Chatbot Leads - Q3"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B] transition-colors h-24"
                placeholder="Campaign objectives and overview..."
              />
            </div>
          </div>
        </div>

        {/* Search Parameters */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Search Parameters</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Target Keywords * (Press Enter)</label>
              <input 
                type="text" 
                value={keywordInput} 
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleAddKeyword}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B] transition-colors mb-2"
                placeholder="Type keyword and press enter..."
              />
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <div key={kw} className="bg-[#F6B32B]/20 border border-[#F6B32B]/30 text-[#F6B32B] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-white">&times;</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {availablePlatforms.map(plat => (
                  <label key={plat} className={`cursor-pointer border rounded-xl px-4 py-2 text-sm font-semibold transition-all ${platforms.includes(plat) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                    <input type="checkbox" className="hidden" checked={platforms.includes(plat)} onChange={() => togglePlatform(plat)} />
                    {plat}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Goals & Timelines */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Goals & Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Total Target</label>
              <input type="number" value={targetLeads} onChange={e => setTargetLeads(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Daily Target</label>
              <input type="number" value={dailyTarget} onChange={e => setDailyTarget(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Deadline *</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Instructions</h2>
          <textarea 
            value={instructions} 
            onChange={e => setInstructions(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B] transition-colors h-32"
            placeholder="Special instructions for the hunters..."
          />
        </div>

        {/* Assignment */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Assign Students</h2>
          <div className="max-h-64 overflow-y-auto custom-scrollbar border border-white/10 rounded-xl p-2 bg-white/[0.02]">
            {availableStudents.map(student => (
              <label key={student.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedStudents.includes(student.id)} 
                  onChange={() => toggleStudent(student.id)} 
                  className="w-4 h-4 rounded border-white/20 bg-transparent text-[#F6B32B] focus:ring-[#F6B32B]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{student.first_name} {student.last_name}</span>
                  <span className="text-xs text-white/40">{student.enrollment_id} • {student.program || "No Course"}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
          <Link href="/dashboard/campaigns" className="px-6 py-3 rounded-xl font-bold text-sm text-white hover:bg-white/5 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#F6B32B] hover:bg-[#E09B18] text-black px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? "Creating..." : "Launch Campaign"}
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
          </button>
        </div>
      </form>
    </div>
  );
}
