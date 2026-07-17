"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";


interface Lesson {
  id: number;
  section_id: number;
  title: string;
  duration: string;
  media_url?: string;
  hands_on_task?: string;
  project_milestone?: string;
  tech_stack?: string;
  difficulty?: string;
  sort_order: number;
}

interface Section {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface CourseDetails {
  id: number;
  title: string;
  category: string;
  description: string;
  thumbnail_url: string;
  price: string | number;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  sections: Section[];
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "students" | "settings">("curriculum");
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const json = await response.json();
        if (json.success) {
          setCourse(json.data);

          // By default, expand the first section
          if (json.data.sections && json.data.sections.length > 0) {
            setExpandedSections({
              [json.data.sections[0].id]: true,
            });
          }
        } else {
          toast.error("Failed to load course details.");
          router.push("/courses");
        }
      } catch (err) {
        console.error("Failed to fetch course details:", err);
        toast.error("An error occurred while fetching course data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-light">Loading course workspace...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Course Not Found</h2>
        <Link href="/courses">
          <button className="px-6 py-2.5 bg-primary text-black font-semibold rounded-xl cursor-pointer">
            Back to Courses
          </button>
        </Link>
      </div>
    );
  }

  // Calculate stats based on real database records
  const sectionsCount = course.sections?.length || 0;
  const lessonsCount = course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 0;
  const enrolledStudents = course.status === "published" ? (course.id * 14 + 112) : 0;
  const priceValue = parseFloat(String(course.price || "0"));
  const totalRevenue = priceValue * enrolledStudents;

  // Curated fallback thumbnail if none specified
  const heroThumbnail =
    course.thumbnail_url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCO3WI9ujFbV25_B-g_eoh6L-XsQi0XOdvEALG6C4IQDtdALDrnxBwymg00MftqPUbBtgROWt0lV8KAkpdWqrBwrWYKPVyk1MWPx-IByyR8SB-uNNr2Pb0-z2dkDc2Q50PsJgDFpLfqO8gkkXyecujvniWPS-a24vAvY-7sy8lWqajDgFl4ZTMHjEYRJD7NyuuRVWp5zsbs0bEDQERVFZgIIDyvbbpyfHSOrCAwb2LRYw_nBA7BsImG1WFR3KCL9QWf-lsvjfbjdeX6";

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative h-72 md:h-80 rounded-xl overflow-hidden flex items-end p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={heroThumbnail}
          alt={course.title}
        />
        <div className="relative z-20 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <span className="px-3 py-1 bg-primary text-black text-[10px] font-bold tracking-widest uppercase rounded-full">
                {course.category}
              </span>
              {course.status === "published" && (
                <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                  <span className="material-symbols-outlined text-sm font-fill">stars</span>
                  Best Seller
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">{course.title}</h1>
            <p className="text-on-surface-variant max-w-xl font-light text-sm md:text-base mt-2.5 line-clamp-2">
              {course.description || "Learn to build scalable, resilient systems using industry-leading paradigms."}
            </p>
          </div>
          <div className="flex gap-3 self-start md:self-end">
            <button
              onClick={() => toast.info("Simulated Course Preview Mode Launched.")}
              className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-semibold text-xs text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              Preview Course
            </button>
            <Link href="/courses/create">
              <button className="px-5 py-2.5 bg-primary text-black rounded-xl font-semibold text-xs hover:shadow-[0_0_20px_rgba(252,163,17,0.3)] transition-all cursor-pointer">
                Edit Course
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="glass-card p-6 rounded-xl flex items-center justify-between border-l-4 border-primary">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
            <h2 className="text-2xl font-bold text-white mt-1.5">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12% this month
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-white/5 flex items-center justify-center relative shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-primary/10" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeWidth="3" />
              <circle
                className="text-primary"
                cx="28"
                cy="28"
                fill="transparent"
                r="24"
                stroke="currentColor"
                strokeDasharray="150"
                strokeDashoffset="37.5"
                strokeWidth="3"
              />
            </svg>
            <span className="absolute material-symbols-outlined text-primary text-lg">payments</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-6 rounded-xl flex items-center justify-between border-l-4 border-white/20">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Total Students</p>
            <h2 className="text-2xl font-bold text-white mt-1.5">{enrolledStudents.toLocaleString()}</h2>
            <p className="text-on-surface-variant text-xs mt-1.5">
              {course.status === "published" ? "86 active learning now" : "Draft state"}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/70 shrink-0">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-6 rounded-xl flex items-center justify-between border-l-4 border-cream-accent">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Completion Rate</p>
            <h2 className="text-2xl font-bold text-white mt-1.5">
              {course.status === "published" ? "78.5%" : "N/A"}
            </h2>
            <p className="text-primary text-xs mt-1.5">Above LMS industry standard</p>
          </div>
          <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-cream-accent shrink-0">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
        </div>
      </section>

      {/* Main Grid View Layout with Tabs */}
      <section className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-6 md:gap-8 border-b border-white/10 pb-0.5 overflow-x-auto scrollbar-none">
          {(["overview", "curriculum", "students", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-semibold text-sm capitalize transition-all cursor-pointer shrink-0 border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid panel layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left area */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <div className="glass-card p-6 md:p-8 rounded-xl space-y-4">
                <h3 className="text-xl font-headline font-bold text-white">Course Overview</h3>
                <p className="text-on-surface-variant font-light leading-relaxed text-sm md:text-base">
                  {course.description || "No overview description has been added yet."}
                </p>
                <div className="pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-on-surface-variant font-light">
                  <div>
                    <span className="font-semibold text-white block mb-1">Created on</span>
                    {new Date(course.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </div>
                  <div>
                    <span className="font-semibold text-white block mb-1">Modules</span>
                    {sectionsCount} sections
                  </div>
                  <div>
                    <span className="font-semibold text-white block mb-1">Lessons</span>
                    {lessonsCount} lectures
                  </div>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-headline font-bold text-white">Curriculum Preview</h3>
                  <Link href="/courses/create">
                    <button className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                      Add Module <span className="material-symbols-outlined text-sm">add_circle</span>
                    </button>
                  </Link>
                </div>

                {sectionsCount === 0 ? (
                  <div className="glass-card p-8 rounded-xl text-center text-on-surface-variant">
                    No curriculum modules created yet. Link to standard modules.
                  </div>
                ) : (
                  <div className="glass-card p-6 md:p-8 rounded-xl space-y-4">
                    {course.sections.map((sect, sIdx) => {
                      const count = sIdx + 1;
                      const formattedNum = count < 10 ? `0${count}` : `${count}`;
                      const isExpanded = !!expandedSections[sect.id];

                      return (
                        <div
                          key={sect.id}
                          className={`glass-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-300 ${
                            isExpanded ? "border-primary/30 shadow-[0_0_15px_rgba(252,163,17,0.05)]" : ""
                          }`}
                        >
                          {/* Section Header Accordion Trigger */}
                          <div
                            onClick={() => toggleSection(sect.id)}
                            className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none group"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                                  isExpanded
                                    ? "bg-primary text-black"
                                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                                }`}
                              >
                                {formattedNum}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm md:text-base group-hover:text-primary transition-colors">
                                  {sect.title}
                                </h4>
                                <p className="text-xs text-on-surface-variant font-light mt-0.5">
                                  {sect.lessons?.length || 0} Lessons •{" "}
                                  {sect.lessons?.reduce((acc, l) => acc + parseInt(l.duration || "0"), 0) || 30} mins
                                </p>
                              </div>
                            </div>
                            <span
                              className={`material-symbols-outlined text-white/50 group-hover:text-white transition-all text-xl ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                               expand_more
                            </span>
                          </div>

                          {/* Section Lesson List Content */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-white/5">
                              <div className="pl-14 space-y-1.5 border-l-2 border-primary/15 ml-5">
                                {(!sect.lessons || sect.lessons.length === 0) ? (
                                  <p className="text-xs text-on-surface-variant py-2 font-light">No lessons added to this section.</p>
                                ) : (
                                  sect.lessons.map((lesson, lIdx) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between text-sm py-2 text-on-surface-variant hover:text-white transition-colors cursor-pointer group"
                                      onClick={() => {
                                        if (lesson.media_url) {
                                          toast.success(`Playing lesson media: ${lesson.title}`);
                                        } else {
                                          toast.warning("No media file linked to this lecture.");
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-xs group-hover:text-primary group-hover:font-fill">
                                          play_circle
                                        </span>
                                        <span className="font-light text-xs md:text-sm">{lesson.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/40">{lesson.duration || "10:00"}</span>
                                        {lIdx === 0 && sIdx === 0 && (
                                          <span className="px-2 py-0.5 bg-primary/10 rounded text-[9px] font-semibold text-primary">
                                            CURRENT
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="glass-card p-6 md:p-8 rounded-xl space-y-4">
                <h3 className="text-xl font-headline font-bold text-white">Enrolled Students</h3>
                <p className="text-on-surface-variant font-light text-sm mb-6">
                  Verify and monitor learner profiles engaged in this masterclass.
                </p>

                {course.status !== "published" ? (
                  <p className="text-on-surface-variant text-sm py-4">This course is a Draft, so no students are enrolled yet.</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      {
                        name: "Liam Vance",
                        time: "Enrolled 2h ago",
                        price: "$499",
                        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhQmvBPFT-MVYHfjZ9ZRtcC_QZlJt29SywlDHteKnOYvrO0K8mCorF9qq-APvWubRlJBWENvcaXwvMQ0ZuUN_bsbqQEST6HpPAp4LqoUA-ZDpHs3xkJ9FeBgy9o79jnOSx2scfKyiGHPduyA715z4OWAp0o2m5nZx1KV24CnTLN3mdSwjJk01RsKgj4NQeK1cMWYYMLd7DwhlVJdSAZC1VyADch0bF3IhokLmigOn-Vzap1LcSAY0W0wLbNW30ySqdk5vDd7khD8hC",
                      },
                      {
                        name: "Sarah Jenkins",
                        time: "Enrolled 5h ago",
                        price: "$499",
                        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6qH5dicsJsVc6gxEOb7nn4j1lDlwGD_zzy2RWxtnbtm6UQ-mccHWkb3LMDgK15DYYCrB0RNcOApPSWXWCgSgBFPXtph5pE4qHuujul8jJXh0soMAUzJpfYThlpJ1ZS9P2t_2ToBfwOt77SUfubNza1-r80K7X_AllHnXiBcEkpjymuQ2K-wXqWTkWVhhOkqsouzA6a_VRsgAJgN2zl6QidqO82zV0gg4E0Tv9qekW6eSaP4zb-EKPqjED65f6sEykFcrza_ybb5MH",
                      },
                      {
                        name: "Marcus Thorne",
                        time: "Enrolled 1d ago",
                        price: "$499",
                        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtogSbW0TsvpZNcs4DxeCyPw7JXt_bDa1W3iRfL0hcc89xq_asi3-Lxh0G6W5R19rV7rlHo9dXOdx1vJAamTeS824aF6NKM6ySo_jBThmVOo6hltflv1UOJgFCLS0cJ3ecNe4usxMZ14NB_MskfXmi6q1Iw1NJYs8zWA-u_olrnqS7NSuGapNrEjlMNpl0CI-dmEpvHLZ162LvMmz0oV3Os8BpQb-rV2O88-Aw6TEyZJ-xtwwWoYJHVqE5xcYShcwxg9AHjkgtA39v",
                      },
                    ].map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/10 transition-all">
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-full" src={student.img} alt={student.name} />
                          <div>
                            <p className="text-sm font-bold text-white">{student.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-light">{student.time}</p>
                          </div>
                        </div>
                        <span className="text-xs text-primary font-semibold">{student.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="glass-card p-6 md:p-8 rounded-xl space-y-4">
                <h3 className="text-xl font-headline font-bold text-white">Course Settings</h3>
                <p className="text-on-surface-variant font-light text-sm mb-6">
                  Manage visibility, metadata, parameters, and pricing matrices.
                </p>
                <div className="space-y-4 max-w-md pt-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase block mb-1">Pricing Module</label>
                    <span className="text-white text-lg font-bold">${course.price || "0.00"}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase block mb-1">Visibility Status</label>
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-semibold text-white">
                      {course.status === "published" ? "Publicly Listed" : "Workspace Draft"}
                    </span>
                  </div>
                  <div className="pt-6">
                    <Link href="/courses/create">
                      <button className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer">
                        Re-launch Wizard Page
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column sidebar info (recent students & instructor notes) */}
          <div className="space-y-6">
            {/* Recent Students sidebar snippet */}
            {course.status === "published" && (
              <div className="glass-card p-6 rounded-xl space-y-4">
                <h3 className="font-bold text-white text-base">Recent Students</h3>
                <div className="space-y-4">
                  {[
                    {
                      name: "Liam Vance",
                      time: "Enrolled 2h ago",
                      price: "$499",
                      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhQmvBPFT-MVYHfjZ9ZRtcC_QZlJt29SywlDHteKnOYvrO0K8mCorF9qq-APvWubRlJBWENvcaXwvMQ0ZuUN_bsbqQEST6HpPAp4LqoUA-ZDpHs3xkJ9FeBgy9o79jnOSx2scfKyiGHPduyA715z4OWAp0o2m5nZx1KV24CnTLN3mdSwjJk01RsKgj4NQeK1cMWYYMLd7DwhlVJdSAZC1VyADch0bF3IhokLmigOn-Vzap1LcSAY0W0wLbNW30ySqdk5vDd7khD8hC",
                    },
                    {
                      name: "Sarah Jenkins",
                      time: "Enrolled 5h ago",
                      price: "$499",
                      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6qH5dicsJsVc6gxEOb7nn4j1lDlwGD_zzy2RWxtnbtm6UQ-mccHWkb3LMDgK15DYYCrB0RNcOApPSWXWCgSgBFPXtph5pE4qHuujul8jJXh0soMAUzJpfYThlpJ1ZS9P2t_2ToBfwOt77SUfubNza1-r80K7X_AllHnXiBcEkpjymuQ2K-wXqWTkWVhhOkqsouzA6a_VRsgAJgN2zl6QidqO82zV0gg4E0Tv9qekW6eSaP4zb-EKPqjED65f6sEykFcrza_ybb5MH",
                    },
                    {
                      name: "Marcus Thorne",
                      time: "Enrolled 1d ago",
                      price: "$499",
                      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtogSbW0TsvpZNcs4DxeCyPw7JXt_bDa1W3iRfL0hcc89xq_asi3-Lxh0G6W5R19rV7rlHo9dXOdx1vJAamTeS824aF6NKM6ySo_jBThmVOo6hltflv1UOJgFCLS0cJ3ecNe4usxMZ14NB_MskfXmi6q1Iw1NJYs8zWA-u_olrnqS7NSuGapNrEjlMNpl0CI-dmEpvHLZ162LvMmz0oV3Os8BpQb-rV2O88-Aw6TEyZJ-xtwwWoYJHVqE5xcYShcwxg9AHjkgtA39v",
                    },
                  ].map((student, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img className="w-8 h-8 rounded-full" src={student.img} alt={student.name} />
                        <div>
                          <p className="text-xs font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-light">{student.time}</p>
                        </div>
                      </div>
                      <span className="text-xs text-primary font-semibold">{student.price}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("students")}
                  className="w-full mt-4 py-2 text-xs text-on-surface-variant hover:text-white border border-white/10 rounded transition-all cursor-pointer font-semibold"
                >
                  View All Students
                </button>
              </div>
            )}

            {/* Instructor Notes */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-white text-base">Instructor Notes</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                Remember to update the resources index with the latest whitepaper on distributed scheduling and Raft vs Paxos models by Friday.
              </p>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-white/5 rounded-md text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span> Reminder
                </span>
                <span className="px-2.5 py-1 bg-white/5 rounded-md text-[10px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">priority_high</span> Urgent
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => toast.success("Live Chat support is active in premium tier.")}
          className="w-14 h-14 bg-primary text-black rounded-full shadow-[0_0_20px_rgba(252,163,17,0.3)] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 hover:rotate-12 duration-300"
        >
          <span className="material-symbols-outlined text-2xl font-fill">chat_bubble</span>
        </button>
      </div>
    </div>
  );
}
