"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";

export default function StudentCampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [platform, setPlatform] = useState("");
  const [keyword, setKeyword] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [leadQuality, setLeadQuality] = useState<number>(3);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (id) {
      fetchCampaignAndProfile();
    }
  }, [id]);

  const fetchCampaignAndProfile = async () => {
    try {
      // 1. Get student profile ID
      const meRes = await apiClient("/api/users/me");
      const meJson = await meRes.json();
      if (!meJson.success || !meJson.data?.student_id) {
        toast.error("Could not find student profile");
        setIsLoading(false);
        return;
      }
      setStudentId(meJson.data.student_id);

      // 2. Fetch Campaign Data
      const res = await apiClient(`/api/campaigns/${id}`);
      const json = await res.json();
      if (json.success) {
        setCampaign(json.data);
        if (json.data.platforms && json.data.platforms.length > 0) {
          setPlatform(json.data.platforms[0]);
        }
        if (json.data.keywords && json.data.keywords.length > 0) {
          setKeyword(json.data.keywords[0].keyword);
        }
      } else {
        toast.error(json.error || "Failed to load campaign");
      }
    } catch {
      toast.error("Error loading campaign details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !campaign) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaign.id,
          student_id: studentId,
          business_name: businessName,
          contact_person: contactPerson,
          phone, email, website, address, city, country, industry,
          platform, keyword, business_url: businessUrl,
          lead_quality: leadQuality, notes
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Lead submitted successfully!");
        // Reset form
        setBusinessName(""); setContactPerson(""); setPhone(""); setEmail("");
        setWebsite(""); setAddress(""); setCity(""); setCountry(""); setIndustry("");
        setBusinessUrl(""); setNotes(""); setLeadQuality(3);
      } else {
        toast.error(json.error || "Failed to submit lead");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/campaigns" className="text-white/50 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{campaign.title}</h1>
          <p className="text-sm text-white/50 mt-1">Submit leads carefully according to instructions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Form */}
        <div className="lg:col-span-2 bg-[#101827] border border-white/[0.06] rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Lead Submission Form</h2>
          <form onSubmit={handleSubmitLead} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Business Name *</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="Company LLC" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Platform Found On *</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]">
                  {(campaign.platforms || []).map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Keyword Used *</label>
                <select value={keyword} onChange={e => setKeyword(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]">
                  {(campaign.keywords || []).map((k: any) => <option key={k.id} value={k.keyword}>{k.keyword}</option>)}
                </select>
              </div>

              <div className="col-span-full">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Business URL/Profile Link</label>
                <input type="url" value={businessUrl} onChange={e => setBusinessUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="https://linkedin.com/company/..." />
              </div>

              <div className="col-span-full border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold text-white mb-4">Contact Information</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Contact Person</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="John Doe (Owner/CEO)" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="+1 234 567 8900" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="contact@company.com" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Website (if different)</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="https://company.com" />
              </div>

              <div className="col-span-full border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold text-white mb-4">Additional Details</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Industry / Niche</label>
                <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" placeholder="e.g. Real Estate" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Lead Quality Rating (1-5)</label>
                <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setLeadQuality(star)}
                      className={`material-symbols-outlined text-2xl transition-colors ${star <= leadQuality ? 'text-[#F6B32B]' : 'text-white/20 hover:text-white/40'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Notes & Observations</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F6B32B] h-24" placeholder="Any specific details that make this a good lead..." />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || campaign.status !== 'active'}
                className="bg-[#F6B32B] hover:bg-[#E09B18] text-black px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Lead"}
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            {campaign.status !== 'active' && (
              <p className="text-red-400 text-sm text-right mt-2">This campaign is no longer active.</p>
            )}
          </form>
        </div>

        {/* Right Column - Campaign Details */}
        <div className="space-y-6">
          <div className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Campaign Guide</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase mb-2">Instructions</h3>
                <p className="text-sm text-white/70 whitespace-pre-wrap">{campaign.instructions || campaign.description}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase mb-2">Target Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {(campaign.platforms || []).map((p: string) => (
                    <span key={p} className="bg-[#F6B32B]/10 text-[#F6B32B] border border-[#F6B32B]/20 px-2 py-1 rounded text-xs font-medium">{p}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase mb-2">Keywords to Search</h3>
                <div className="flex flex-wrap gap-2">
                  {(campaign.keywords || []).map((k: any) => (
                    <span key={k.id} className="bg-white/5 text-white/70 border border-white/10 px-2 py-1 rounded text-xs">{k.keyword}</span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase mb-1">Daily Target</h3>
                  <p className="text-xl font-bold text-white">{campaign.daily_target} <span className="text-sm font-normal text-white/50">leads</span></p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase mb-1">Total Target</h3>
                  <p className="text-xl font-bold text-emerald-400">{campaign.target_leads} <span className="text-sm font-normal text-white/50">leads</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
