"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://omnilearn-lms.onrender.com";

// ─────────────────────────────────────────
// Nav link helper
// ─────────────────────────────────────────
function NavLink({
  href,
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
        active
          ? "bg-[#F6B32B]/10 text-[#F6B32B] border border-[#F6B32B]/20 shadow-[0_0_12px_rgba(246,179,43,0.08)]"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] transition-all ${
          active ? "text-[#F6B32B]" : "group-hover:text-white/80"
        }`}
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold tracking-tight">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
      {label}
    </p>
  );
}

// ─────────────────────────────────────────
// Main Navigation Component
// ─────────────────────────────────────────
export default function Navigation({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingAdmissions, setPendingAdmissions] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");

  const closeMobile = () => setIsMobileMenuOpen(false);

  // ── fetch notifications
  const fetchNotifications = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${uid}&limit=10`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch {}
  }, []);

  // ── fetch pending admissions count (admin only)
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/training-applications/count`);
      const json = await res.json();
      if (json.success) setPendingAdmissions(json.count || 0);
    } catch {}
  }, []);

  // ── mark all read
  const markAllRead = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  // ── auth guard + role routing
  useEffect(() => {
    const auth = localStorage.getItem("lms_auth") === "true";
    const role = localStorage.getItem("lms_user_role");
    const uid = localStorage.getItem("lms_user_id");
    setIsAuthenticated(auth);
    setUserRole(role);
    setUserId(uid);

    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/apply") ||
      pathname.startsWith("/login");

    if (auth) {
      if (role === "student") {
        const studentStr = localStorage.getItem("lms_student_info");
        const hasStudentInfo =
          studentStr && studentStr !== "undefined" && studentStr !== "null";

        if (!hasStudentInfo && uid) {
          fetch(`${API_BASE_URL}/api/students/profile?userId=${uid}`)
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.data) {
                localStorage.setItem("lms_student_info", JSON.stringify(res.data));
                window.location.reload();
              } else {
                toast.error("Profile invalid. Re-login.");
                localStorage.clear();
                router.push("/");
              }
            })
            .catch(() => {});
        }

        try {
          if (hasStudentInfo) {
            const student = JSON.parse(studentStr!);
            setDisplayName(`${student.first_name || ""} ${student.last_name || ""}`.trim());
            setAvatarUrl(student.avatar_url || null);
            const isComplete =
              student.first_name?.trim() &&
              student.last_name?.trim() &&
              student.whatsapp?.trim() &&
              student.cnic?.trim() &&
              student.university?.trim() &&
              student.semester;
            setProfileIncomplete(!isComplete);
          }
        } catch {}

        if (!pathname.startsWith("/student/") && !isPublicRoute) {
          router.push("/student/dashboard");
          return;
        }
      } else if (role === "trainer") {
        setProfileIncomplete(false);
        if (pathname.startsWith("/student/") || pathname.startsWith("/dashboard")) {
          router.push("/trainer/dashboard");
          return;
        }
        if (!pathname.startsWith("/trainer/") && !pathname.startsWith("/tasks") && !isPublicRoute) {
          router.push("/trainer/dashboard");
          return;
        }
        // Fetch trainer profile for display name + avatar
        if (uid) {
          fetch(`${API_BASE_URL}/api/trainers/profile?userId=${uid}`)
            .then((r) => r.json())
            .then((res) => {
              if (res.success && res.data) {
                setDisplayName(`${res.data.first_name || ""} ${res.data.last_name || ""}`.trim());
                setAvatarUrl(res.data.avatar_url || null);
              }
            })
            .catch(() => {});
        }
      } else {
        // Admin
        setProfileIncomplete(false);
        setDisplayName("Admin");
        if (pathname.startsWith("/student/") || pathname.startsWith("/trainer/")) {
          router.push("/dashboard");
          return;
        }
        fetchPendingCount();
      }

      if (pathname === "/") {
        if (role === "student") router.push("/student/dashboard");
        else if (role === "trainer") router.push("/trainer/dashboard");
        else router.push("/dashboard");
        return;
      }

      // Fetch notifications for all authenticated users
      if (uid) fetchNotifications(uid);
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
  }, [pathname, router, fetchNotifications, fetchPendingCount]);

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!userId || !isAuthenticated) return;
    const interval = setInterval(() => {
      fetchNotifications(userId);
      if (userRole === "admin") fetchPendingCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, isAuthenticated, userRole, fetchNotifications, fetchPendingCount]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_auth");
    localStorage.removeItem("lms_user_role");
    localStorage.removeItem("lms_user_id");
    localStorage.removeItem("lms_student_info");
    toast.success("Logged out successfully.");
    router.push("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-[#090D16] flex flex-col items-center justify-center z-50">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#F6B32B]/20 border-t-[#F6B32B] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F6B32B] text-2xl">bolt</span>
          </div>
        </div>
        <p className="text-white/40 font-light text-sm tracking-wide">Authenticating session…</p>
      </div>
    );
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/login");

  if (isPublicRoute) return <>{children}</>;

  // ─── Sidebar content by role ───────────────────────────────────────────
  const renderSidebar = () => {
    if (userRole === "student") {
      return (
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pb-4">
          <NavSection label="Main" />
          <NavLink href="/student/dashboard" icon="grid_view" label="Dashboard" active={pathname === "/student/dashboard"} onClick={closeMobile} />
          <NavSection label="Learning" />
          <NavLink href="/student/tasks" icon="assignment" label="My Tasks" active={pathname === "/student/tasks"} onClick={closeMobile} />
          <NavLink href="/student/submit-task" icon="upload" label="Submit Task" active={pathname === "/student/submit-task"} onClick={closeMobile} />
          <NavLink href="/student/performance" icon="trending_up" label="Performance" active={pathname === "/student/performance"} onClick={closeMobile} />
          <NavSection label="Records" />
          <NavLink href="/student/attendance" icon="event_available" label="Attendance" active={pathname === "/student/attendance"} onClick={closeMobile} />
          <NavLink href="/student/announcements" icon="campaign" label="Announcements" active={pathname === "/student/announcements"} onClick={closeMobile} />
          <NavSection label="Finance" />
          <NavLink href="/student/fees" icon="payments" label="My Fees" active={pathname === "/student/fees"} onClick={closeMobile} />
          
          <NavSection label="Account" />
          <NavLink href="/student/profile" icon="person" label="My Profile" active={pathname === "/student/profile"} onClick={closeMobile} />
        </nav>
      );
    }

    if (userRole === "trainer") {
      return (
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pb-4">
          <NavSection label="Main" />
          <NavLink href="/trainer/dashboard" icon="grid_view" label="Dashboard" active={pathname === "/trainer/dashboard"} onClick={closeMobile} />
          <NavSection label="Tasks" />
          <NavLink href="/tasks/new" icon="add_task" label="Assign Task" active={pathname === "/tasks/new"} onClick={closeMobile} />
          <NavLink href="/trainer/submitted-tasks" icon="inbox" label="Submitted Tasks" active={pathname === "/trainer/submitted-tasks"} onClick={closeMobile} />
          <NavSection label="Management" />
          <NavLink href="/trainer/students" icon="group" label="Students" active={pathname === "/trainer/students"} onClick={closeMobile} />
          <NavLink href="/trainer/attendance" icon="event_available" label="Mark Attendance" active={pathname === "/trainer/attendance"} onClick={closeMobile} />
          <NavLink href="/trainer/announcements" icon="campaign" label="Announcements" active={pathname === "/trainer/announcements"} onClick={closeMobile} />
          <NavSection label="Account" />
          <NavLink href="/trainer/profile" icon="person" label="My Profile" active={pathname === "/trainer/profile"} onClick={closeMobile} />
        </nav>
      );
    }

    // Admin
    return (
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pb-4">
        <NavSection label="Overview" />
        <NavLink href="/dashboard" icon="grid_view" label="Dashboard" active={pathname === "/dashboard"} onClick={closeMobile} />
        <NavSection label="People" />
        <NavLink href="/students" icon="school" label="Students" active={pathname.startsWith("/students") && !pathname.startsWith("/students/applicants")} onClick={closeMobile} />
        <NavLink href="/dashboard/trainers" icon="badge" label="Trainers" active={pathname === "/dashboard/trainers"} onClick={closeMobile} />
        <NavLink href="/students/applicants" icon="how_to_reg" label="Admissions" active={pathname === "/students/applicants"} badge={pendingAdmissions} onClick={closeMobile} />
        <NavSection label="Content" />
        <NavLink href="/courses" icon="menu_book" label="Courses" active={pathname.startsWith("/courses")} onClick={closeMobile} />
        <NavLink href="/tasks/new" icon="add_task" label="Assign Task" active={pathname === "/tasks/new"} onClick={closeMobile} />
        <NavLink href="/tasks/completed" icon="task_alt" label="Submissions" active={pathname === "/tasks/completed"} onClick={closeMobile} />
        <NavSection label="Finance" />
        <NavLink href="/dashboard/fees" icon="account_balance_wallet" label="Fee Management" active={pathname === "/dashboard/fees"} onClick={closeMobile} />
        <NavSection label="Analytics" />
        <NavLink href="/dashboard/reports" icon="bar_chart" label="Reports" active={pathname === "/dashboard/reports"} onClick={closeMobile} />
        <NavLink href="/dashboard/announcements" icon="campaign" label="Announcements" active={pathname === "/dashboard/announcements"} onClick={closeMobile} />
        <NavSection label="System" />
        <NavLink href="/dashboard/settings" icon="settings" label="Settings" active={pathname === "/dashboard/settings"} onClick={closeMobile} />
      </nav>
    );
  };

  // ─── Role badge ──────────────────────────────────────────────────────────
  const roleBadge = {
    admin: { label: "Administrator", color: "from-[#F6B32B] to-[#E09B18]", text: "text-black" },
    trainer: { label: "Trainer", color: "from-blue-500 to-blue-700", text: "text-white" },
    student: { label: "Student", color: "from-emerald-500 to-emerald-700", text: "text-white" },
  }[userRole || "student"] || { label: "User", color: "from-gray-500 to-gray-700", text: "text-white" };

  const homePath = userRole === "student" ? "/student/dashboard" : userRole === "trainer" ? "/trainer/dashboard" : "/dashboard";

  return (
    <>
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-4 md:px-6 h-16 bg-[#090D16]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <Link href={homePath} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F6B32B] to-[#E09B18] flex items-center justify-center shadow-lg shadow-[#F6B32B]/20">
              <span className="material-symbols-outlined text-black text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight hidden sm:block">
              Falcon Swift <span className="text-[#F6B32B]">LMS</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden lg:block">
            <input
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm w-56 focus:outline-none focus:border-[#F6B32B]/40 transition-all text-white placeholder-white/25"
              placeholder="Quick search…"
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-2 text-white/30 text-[18px]">search</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#090D16]" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#101827] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-[#F6B32B] hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-white/20 text-4xl block mb-2">notifications_none</span>
                      <p className="text-white/30 text-sm">No notifications yet</p>
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/5 transition-colors ${!n.is_read ? "bg-[#F6B32B]/5" : ""}`}>
                      <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-white/25 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-2 ml-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#F6B32B]/30 shrink-0 bg-[#1E2A3B]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F6B32B]/20 to-[#E09B18]/10">
                  <span className="material-symbols-outlined text-[#F6B32B] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
              )}
            </div>
            <span className="hidden md:block text-sm font-semibold text-white/80 max-w-[120px] truncate">{displayName}</span>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col pt-16 z-50 md:z-40 transition-transform duration-300 border-r border-white/[0.06] bg-[#090D16] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close (mobile) */}
        <button className="absolute top-5 right-4 md:hidden text-white/40 hover:text-white" onClick={closeMobile}>
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Role badge */}
        <div className="px-4 pt-5 pb-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${roleBadge.color} ${roleBadge.text} text-[11px] font-bold uppercase tracking-wider`}>
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {userRole === "admin" ? "admin_panel_settings" : userRole === "trainer" ? "school" : "person"}
            </span>
            {roleBadge.label}
          </div>
        </div>

        {/* Navigation links */}
        {renderSidebar()}

        {/* Bottom: Logout */}
        <div className="px-3 pb-6 pt-2 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="md:ml-64 pt-16 min-h-screen relative z-10">
        {/* Profile incomplete banner */}
        {profileIncomplete && (
          <div className="mx-4 mt-4 p-4 bg-orange-500/10 border border-orange-500/25 rounded-2xl flex items-center gap-3 shadow-[0_4px_20px_rgba(249,115,22,0.1)]">
            <span className="material-symbols-outlined text-orange-400 text-xl shrink-0">warning</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">Profile Incomplete</p>
              <p className="text-[11px] text-white/50 mt-0.5">Complete your profile to unlock all LMS features.</p>
            </div>
            <Link
              href="/student/profile"
              className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-500/90 text-black font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all"
            >
              Complete
            </Link>
          </div>
        )}
        <div className="px-4 sm:px-6 md:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Notification backdrop close */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </>
  );
}
