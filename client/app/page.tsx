"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";

export default function Dashboard() {
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
      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-6 py-3 bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_rgba(125,211,252,0.05)]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-headline font-semibold tracking-tight text-primary">
            Glacier
          </span>
          <div className="hidden md:flex gap-6 ml-10">
            <a
              className="text-primary font-semibold border-b-2 border-primary pb-1 font-body-md text-sm"
              href="#"
            >
              Overview
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-sm"
              href="#"
            >
              Reports
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-sm"
              href="#"
            >
              Team
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:border-gold-accent transition-all"
              placeholder="Search learning materials..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-lg">
              search
            </span>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-all">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-all">
            help
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gold-accent/50">
            <img
              alt="User avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBodHFNUpxhuuuel4X1YH69Bzjd8eld_2A8IqbRAytMStzuG0hXaTt0LCK6CtzrUhYlmdUJ7MD0tAnZfLQVOEFJwsftuFc1vcwGvGpd7HvcjYPE_ZGE9P9PBy6tpeE4FJgFXIi6gbwvo_xr4QJ_Oqg9lH5Xy0J6zFdm_AZRFayBN6rl922oZTq-L3WZHGNQpZ6YmjUPRTE8uVBgDy8XhzCqP_kNo7-m1RmH99bDMe4GTqr5aKE0W6FBnBE0b_l_joA3NnrKFUjcT2p3"
            />
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col pt-20 z-40 glass-sidebar">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-accent rounded-xl flex items-center justify-center text-black font-bold">
              G
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface leading-tight">
                Glacier Pro
              </h2>
              <p className="text-xs text-on-surface-variant">Enterprise Tier</p>
            </div>
          </div>
          <button className="w-full py-3 bg-gold-accent hover:bg-gold-accent/90 text-black font-semibold rounded-xl transition-all shadow-lg shadow-gold-accent/20 flex items-center justify-center gap-2">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_circle
            </span>
            New Project
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          <a
            className="bg-primary/10 text-primary border-r-4 border-primary rounded-r-lg px-4 py-3 flex items-center gap-3 transition-transform translate-x-1 duration-200"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="grid_view">
              grid_view
            </span>
            <span className="font-body-md text-sm">Dashboard</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="leaderboard">
              leaderboard
            </span>
            <span className="font-body-md text-sm">Analytics</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span
              className="material-symbols-outlined"
              data-icon="account_balance_wallet"
            >
              account_balance_wallet
            </span>
            <span className="font-body-md text-sm">Assets</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
            <span className="font-body-md text-sm">Settings</span>
          </a>
        </nav>
        <div className="px-3 pb-6 border-t border-white/5 pt-6 space-y-1">
          <a
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span
              className="material-symbols-outlined"
              data-icon="contact_support"
            >
              contact_support
            </span>
            <span className="font-body-md text-sm">Support</span>
          </a>
          <a
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="logout">
              logout
            </span>
            <span className="font-body-md text-sm">Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 px-10 pb-12">
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
            {/* Course Card 1 */}
            <div className="glass-card rounded-lg overflow-hidden flex flex-col group hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAADnCXLsbIOu6G3OcvLEcUKgkzT3v7V8cU0z9UiXSi85WD7SDPJMVc0c6LpHU5A8OL9OEvJ7qdR76iOOn1CI2j1CO7yXke82gY0L7MtOt9Mjq8rZYba0iDKBRAmfiN_l5IkGeMkuK8AxppAU9hhS-GuAI9epFgMQ2OwaEjG_lLeXawdSNLbRdmUxaf9PXvsOhoaWNuHwzBHOgBLgcDzJH7ahnX3We0P9kvMN4PGQ3scJQunkxmm8Swy0My4F4ZItW5TpyiFi6c53vl"
                  alt="Advanced Distributed Systems"
                />
                <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                    Expert
                  </span>
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                    24 Hours
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-body-lg font-semibold text-white mb-2 line-clamp-1">
                  Advanced Distributed Systems
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                  Master the art of building resilient, scalable, and highly
                  available systems in the modern cloud era.
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
                      4.9 (1.2k)
                    </span>
                  </div>
                  <button className="bg-gold-accent hover:bg-gold-accent/90 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="glass-card rounded-lg overflow-hidden flex flex-col group hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIY4qHbJqqpP3isgw-O186FgdBZkomOsTxvbazV3Fqb2Kw9lde3KP59tmfLh_RGGgRe4v-4bsw7NoxMstmmK4OA1wIafTZKs8_MsTyu_0DZdu4-BlzYeUAzZRcQiUyZhfQEmwQwCEHxTUB3Mp6tXqHXhg-dwaZiyHVDq_IR9wLMOQlzakX8Drw5wqyltnnC6VKSzGSOy_v7Of7tqonhENpE46MCTTt3842rxI8lOjyEnFtdsnbgHMZR5sf0tkOCNyO38qEE2r556iE"
                  alt="Data Engineering with Kafka"
                />
                <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                    Intermediate
                  </span>
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                    12 Hours
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-body-lg font-semibold text-white mb-2 line-clamp-1">
                  Data Engineering with Kafka
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                  Learn to build real-time data pipelines and stream processing
                  applications using Apache Kafka.
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
                      4.8 (840)
                    </span>
                  </div>
                  <button className="bg-gold-accent hover:bg-gold-accent/90 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>

            {/* Course Card 3 */}
            <div className="glass-card rounded-lg overflow-hidden flex flex-col group hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB18OtrDFBgd3BmFT-r3T2oAcG-XcuT5I00gmN3U-LUguYy-INje3rzdUGGLLypOX_MYyKroBzxTHQUg---3AGRzKhtiQoFym2HEOh6smh_lKuDy21j6R5mHu5vqe06VBjod3v-Tj9AsT3w8sInffBusPis4lnUwMZhmDgTMFpnsRP1403uvMPmEsXrVudujv0o4-xEjk24FHba3sH08YUQ7WXaLBtOAEkhv_g7NOGJyYgjK7Q7y7W--PNLHbq_D7tBHkk-KkfQdDmb"
                  alt="Introduction to Web3 Architecture"
                />
                <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                  <span className="px-3 py-1 bg-gold-accent text-black text-[10px] font-bold uppercase rounded-full tracking-wider">
                    Beginner
                  </span>
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                    8 Hours
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-body-lg font-semibold text-white mb-2 line-clamp-1">
                  Introduction to Web3 Architecture
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                  Understand the fundamentals of decentralized applications and
                  blockchain technology foundations.
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
                      4.7 (2.1k)
                    </span>
                  </div>
                  <button className="bg-gold-accent hover:bg-gold-accent/90 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
