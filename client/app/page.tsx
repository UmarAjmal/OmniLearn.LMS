"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/courses");
        const json = await response.json();
        if (json.success) {
          setCourses(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    // Show toast after 2 seconds
    const timer = setTimeout(() => {
      toast(
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-gold-accent text-2xl">
            emoji_events
          </span>
          <div>
            <p className="text-sm font-bold text-white">Daily Streak Active!</p>
            <p className="text-xs text-on-surface-variant">
              You've logged in 5 days in a row.
            </p>
          </div>
        </div>,
        {
          className: "glass-card border-l-4 border-gold-accent",
          autoClose: 5000,
          hideProgressBar: true,
        }
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Hero Welcome */}
        <section className="mb-10">
          <h1 className="text-display-lg font-display-lg text-primary mb-2 text-4xl">
            Welcome back, Alexander
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            You've completed 75% of your weekly learning goals. Keep it up and
            earn your "Data Architect" badge by Friday.
          </p>
        </section>

        {/* Bento Grid Stats & Progress */}
        <div className="grid grid-cols-12 gap-6 mb-10">
          {/* Circular Progress Card */}
          <div className="col-span-12 lg:col-span-4 glass-card rounded-lg p-8 flex flex-col items-center justify-center">
            <h3 className="text-headline-md font-headline-md text-primary mb-6 w-full text-xl">
              Current Progress
            </h3>
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-white/5"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                ></circle>
                <circle
                  className="text-gold-accent drop-shadow-[0_0_8px_rgba(252,163,17,0.5)]"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="88"
                  stroke="currentColor"
                  strokeDasharray="552.92"
                  strokeDashoffset="138.23"
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">75%</span>
                <span className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">
                  Mastery
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-on-surface-variant">
              Advanced Cloud Architecture • Module 4
            </p>
          </div>

          {/* Learning Velocity Card */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-card rounded-lg p-8">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-headline-md font-headline-md text-primary text-xl">
                Learning Velocity
              </h3>
              <span
                className="material-symbols-outlined text-gold-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
            </div>
            <div className="space-y-6">
              <div className="flex items-end gap-2 h-32 px-2">
                <div className="flex-1 bg-white/10 rounded-t-lg h-[40%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
                <div className="flex-1 bg-white/10 rounded-t-lg h-[65%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
                <div className="flex-1 bg-gold-accent/80 rounded-t-lg h-[85%] hover:bg-gold-accent transition-all cursor-pointer"></div>
                <div className="flex-1 bg-white/10 rounded-t-lg h-[55%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
                <div className="flex-1 bg-white/10 rounded-t-lg h-[75%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
                <div className="flex-1 bg-white/10 rounded-t-lg h-[95%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
                <div className="flex-1 bg-white/10 rounded-t-lg h-[45%] hover:bg-gold-accent/20 transition-all cursor-pointer"></div>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </div>
          </div>

          {/* Schedule / Upcoming Card */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-card rounded-lg p-8">
            <h3 className="text-headline-md font-headline-md text-primary mb-6 text-xl">
              Upcoming Lessons
            </h3>
            <div className="space-y-5 custom-scrollbar overflow-y-auto max-h-[220px] pr-2">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-navy-accent flex items-center justify-center shrink-0 border border-white/10 group-hover:border-gold-accent/30 transition-all">
                  <span className="material-symbols-outlined text-gold-accent">
                    video_library
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">
                    Live Webinar: Kubernetes
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Today • 14:00 - 15:30
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-gold-accent">
                  arrow_forward_ios
                </span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border-l-2 border-gold-accent">
                <div className="w-12 h-12 rounded-lg bg-navy-accent flex items-center justify-center shrink-0 border border-white/10 group-hover:border-gold-accent/30 transition-all">
                  <span className="material-symbols-outlined text-gold-accent">
                    quiz
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">
                    Final Exam: Python Scripting
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Tomorrow • 09:00 AM
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-gold-accent">
                  arrow_forward_ios
                </span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-navy-accent flex items-center justify-center shrink-0 border border-white/10 group-hover:border-gold-accent/30 transition-all">
                  <span className="material-symbols-outlined text-gold-accent">
                    edit_document
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white">
                    Architecture Peer Review
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Aug 24 • 11:30 AM
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-gold-accent">
                  arrow_forward_ios
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Courses Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-primary text-2xl">
                Recommended for You
              </h2>
              <p className="text-on-surface-variant text-body-md mt-1">
                Based on your recent interest in System Design and Scalability.
              </p>
            </div>
            <button className="text-gold-accent font-semibold hover:underline flex items-center gap-1 transition-all">
              Browse All Courses
              <span className="material-symbols-outlined text-sm">
                open_in_new
              </span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 text-center py-12">
                <div className="w-10 h-10 border-4 border-gold-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-on-surface-variant text-sm">Loading premium courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-3 text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 block">school</span>
                <p className="text-white font-bold text-base">No courses created yet</p>
                <p className="text-on-surface-variant text-xs mt-1">Get started by clicking the "New Course" button in the sidebar.</p>
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="glass-card rounded-lg overflow-hidden flex flex-col group hover:translate-y-[-4px] transition-all duration-300">
                  <div className="h-48 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      src={course.thumbnail_url || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop"}
                      alt={course.title}
                    />
                    <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                      <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                        {course.category || "Technology"}
                      </span>
                      {course.status === "draft" ? (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase rounded-full tracking-wider">
                          Draft
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                          {course.lessons_count || 0} Lessons
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-body-lg font-semibold text-white mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                      {course.description || "No description provided yet."}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-cream-accent/20 flex items-center justify-center">
                          <span
                            className="material-symbols-outlined text-xs text-cream-accent"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-cream-accent">
                          4.9 ({100 + (course.id % 5) * 45})
                        </span>
                      </div>
                      <Link href={course.status === "draft" ? `/courses/create` : "#"}>
                        <button className="bg-gold-accent hover:bg-gold-accent/90 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer">
                          {course.status === "draft" ? "Edit Draft" : "Start Learning"}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
    </>
  );
}
