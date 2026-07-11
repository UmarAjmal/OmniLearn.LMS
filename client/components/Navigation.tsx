"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith("/tasks")) {
      setIsTasksOpen(true);
    }
  }, [pathname]);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("lms_auth") === "true";
    const role = localStorage.getItem("lms_user_role");
    setIsAuthenticated(auth);
    setUserRole(role);

    const isPublicRoute = pathname === "/" || pathname.startsWith("/signup") || pathname.startsWith("/apply");

    if (auth) {
      if (role === "student") {
        // Parse and check if profile is complete
        try {
          const studentStr = localStorage.getItem("lms_student_info");
          if (studentStr && studentStr !== "undefined" && studentStr !== "null") {
            const student = JSON.parse(studentStr);
            if (student) {
              const isComplete = 
                student.first_name?.trim() && 
                student.last_name?.trim() && 
                student.whatsapp?.trim() && 
                student.cnic?.trim() && 
                student.university?.trim() && 
                student.semester;
              setProfileIncomplete(!isComplete);
            } else {
              setProfileIncomplete(true);
            }
          } else {
            setProfileIncomplete(true);
          }
        } catch (e) {
          console.error(e);
          setProfileIncomplete(true);
        }

        if (!pathname.startsWith("/student/") && !isPublicRoute) {
          router.push("/student/dashboard");
          return;
        }
      } else {
        // Admin
        setProfileIncomplete(false);
        if (pathname.startsWith("/student/")) {
          router.push("/dashboard");
          return;
        }
      }
      if (pathname === "/") {
        if (role === "student") {
          router.push("/student/dashboard");
        } else {
          router.push("/dashboard");
        }
        return;
      }
      setIsCheckingAuth(false);
    } else {
      setProfileIncomplete(false);
      if (!isPublicRoute) {
        toast.error("Please sign in to access the portal.");
        router.push("/");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [pathname, router]);

  // Handle logout
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("lms_auth");
    localStorage.removeItem("lms_user_role");
    localStorage.removeItem("lms_user_id");
    localStorage.removeItem("lms_student_info");
    toast.success("Successfully logged out.");
    router.push("/");
  };

  // Determine dynamic title based on route
  const getHeaderTitle = () => {
    if (pathname.includes("/courses/create")) {
      return "Course Builder";
    }
    return "Falcon LMS";
  };

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-light text-sm">Authenticating session...</p>
      </div>
    );
  }

  const isPublicRoute = pathname === "/" || pathname.startsWith("/signup") || pathname.startsWith("/apply");
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-4 md:px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_30px_rgba(125,211,252,0.05)] h-16 md:h-20">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden text-on-surface-variant hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <Link href="/dashboard">
            <span className="text-xl font-headline font-semibold tracking-tight text-primary flex items-center gap-2 cursor-pointer">
              {pathname.includes("/courses/create") && (
                <span className="material-symbols-outlined hidden sm:block">school</span>
              )}
              {getHeaderTitle()}
            </span>
          </Link>
          
          {pathname.includes("/courses/create") && (
            <>
              <span className="h-6 w-px bg-outline-variant/30 hidden sm:block"></span>
              <span className="px-3 py-1 bg-surface-variant/50 rounded-full text-xs font-label-md text-on-surface-variant hidden sm:block">
                Workspace Active
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          {!pathname.includes("/courses/create") && (
            <div className="relative hidden md:block">
              <input
                className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm w-64 focus:outline-none focus:border-gold-accent transition-all text-white placeholder-white/30"
                placeholder="Search learning materials..."
                type="text"
              />
              <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-lg">
                search
              </span>
            </div>
          )}
          <button className="material-symbols-outlined text-on-surface-variant hover:text-white transition-all text-xl md:text-2xl">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-white transition-all hidden sm:block text-xl md:text-2xl">
            help
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-gold-accent/50 ml-1 md:ml-2 shrink-0">
            <img
              alt="User avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBodHFNUpxhuuuel4X1YH69Bzjd8eld_2A8IqbRAytMStzuG0hXaTt0LCK6CtzrUhYlmdUJ7MD0tAnZfLQVOEFJwsftuFc1vcwGvGpd7HvcjYPE_ZGE9P9PBy6tpeE4FJgFXIi6gbwvo_xr4QJ_Oqg9lH5Xy0J6zFdm_AZRFayBN6rl922oZTq-L3WZHGNQpZ6YmjUPRTE8uVBgDy8XhzCqP_kNo7-m1RmH99bDMe4GTqr5aKE0W6FBnBE0b_l_joA3NnrKFUjcT2p3"
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col pt-16 md:pt-20 z-50 md:z-40 glass-sidebar transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Mobile close button */}
        <button 
          className="absolute top-4 right-4 md:hidden text-on-surface-variant"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* <div className="px-6 mb-8 mt-4 md:mt-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-accent rounded-xl flex items-center justify-center text-black font-bold shrink-0">
              G
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-white leading-tight">
                Glacier Pro
              </h2>
              <p className="text-xs text-on-surface-variant">Enterprise Tier</p>
            </div>
          </div>
          <Link href="/courses/create" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full py-3 bg-gold-accent hover:bg-gold-accent/90 text-black font-semibold rounded-xl transition-all shadow-lg shadow-gold-accent/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_circle
              </span>
              New Course
            </button>
          </Link>
        </div> */}
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {userRole === "student" ? (
            <>
              <Link
                href="/student/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname === "/student/dashboard" 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined">
                  grid_view
                </span>
                <span className="font-body-md text-sm font-semibold">Dashboard</span>
              </Link>
              <Link
                href="/student/submit-task"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname === "/student/submit-task" 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined">
                  upload
                </span>
                <span className="font-body-md text-sm font-semibold">Submit Task</span>
              </Link>
              <Link
                href="/student/tasks"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname === "/student/tasks" 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined">
                  assignment
                </span>
                <span className="font-body-md text-sm font-semibold">Tasks List</span>
              </Link>
              <Link
                href="/student/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname === "/student/profile" 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined">
                  person
                </span>
                <span className="font-body-md text-sm font-semibold">Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname === "/dashboard" 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined" data-icon="grid_view">
                  grid_view
                </span>
                <span className="font-body-md text-sm font-semibold">Dashboard</span>
              </Link>
              <Link
                href="/students"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 flex items-center gap-3 rounded-lg transition-all ${
                  pathname.startsWith("/students")
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-on-surface-variant hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined" data-icon="group">
                  group
                </span>
                <span className="font-body-md text-sm font-semibold">Students</span>
              </Link>
              
              {/* Tasks Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setIsTasksOpen(!isTasksOpen)}
                  className={`w-full px-4 py-3 flex items-center justify-between rounded-lg transition-all border-none bg-transparent cursor-pointer text-left ${
                    pathname.startsWith("/tasks")
                      ? "bg-primary/5 text-primary"
                      : "text-on-surface-variant hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" data-icon="assignment">
                      assignment
                    </span>
                    <span className="font-body-md text-sm font-semibold">Tasks</span>
                  </div>
                  <span className={`material-symbols-outlined transition-transform duration-200 text-sm ${isTasksOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                
                {isTasksOpen && (
                  <div className="pl-9 pr-2 mt-1 space-y-1">
                    <Link
                      href="/tasks/new"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2 flex items-center gap-2 rounded-lg transition-all text-xs font-semibold uppercase tracking-wider block ${
                        pathname === "/tasks/new"
                          ? "text-primary bg-primary/10 border-l-2 border-primary"
                          : "text-on-surface-variant/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span>
                      <span>New Task</span>
                    </Link>
                    <Link
                      href="/tasks/completed"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-2 flex items-center gap-2 rounded-lg transition-all text-xs font-semibold uppercase tracking-wider block ${
                        pathname === "/tasks/completed"
                          ? "text-primary bg-primary/10 border-l-2 border-primary"
                          : "text-on-surface-variant/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      <span>Complete Task</span>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
          <a
            className="text-on-surface-variant hover:text-white hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span className="material-symbols-outlined" data-icon="settings">
              settings
            </span>
            <span className="font-body-md text-sm font-semibold">Settings</span>
          </a>
        </nav>
        <div className="px-3 pb-6 border-t border-white/5 pt-6 space-y-1">
          <a
            className="text-on-surface-variant hover:text-white hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all"
            href="#"
          >
            <span
              className="material-symbols-outlined"
              data-icon="contact_support"
            >
              contact_support
            </span>
            <span className="font-body-md text-sm font-semibold">Support</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left text-on-surface-variant hover:text-white hover:bg-white/10 px-4 py-3 flex items-center gap-3 rounded-lg transition-all cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined" data-icon="logout">
              logout
            </span>
            <span className="font-body-md text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-20 md:pt-24 px-4 sm:px-6 md:px-10 pb-12 min-h-screen relative z-10 transition-all duration-300">
        {profileIncomplete && (
          <div className="mb-6 p-4 bg-orange-500/10 border-2 border-orange-500/25 rounded-2xl flex items-center gap-3.5 shadow-[0_4px_20px_rgba(249,115,22,0.1)]">
            <span className="material-symbols-outlined text-orange-400 text-2xl shrink-0">warning</span>
            <div>
              <p className="text-xs font-bold text-white">Profile Incomplete!</p>
              <p className="text-[10px] text-on-surface-variant font-light mt-0.5">
                You must complete your profile (compulsory fields) in order to unlock all executive LMS features.
              </p>
            </div>
            <Link
              href="/student/profile"
              className="ml-auto px-4 py-2 bg-orange-500 hover:bg-orange-500/90 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all decoration-none active:scale-[0.97]"
            >
              Complete Now
            </Link>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
