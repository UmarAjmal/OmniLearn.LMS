"use client";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">System Settings</h1>
        <p className="text-white/40 text-sm">Configure your LMS platform</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: "mail", label: "Email Configuration", desc: "Configure SMTP for automated emails", status: "Active" },
          { icon: "lock", label: "Security Settings", desc: "Manage JWT, passwords, and sessions", status: "Secure" },
          { icon: "notifications", label: "Notification Settings", desc: "Control email and in-app notifications", status: "Enabled" },
          { icon: "palette", label: "Branding", desc: "Logo, colors, and platform name", status: "Default" },
          { icon: "storage", label: "Database", desc: "PostgreSQL connection and migrations", status: "Connected" },
          { icon: "backup", label: "Backup & Export", desc: "Export data in CSV or JSON format", status: "Manual" },
        ].map((item) => (
          <div key={item.label} className="bg-[#101827] border border-white/[0.06] rounded-2xl p-6 flex items-start gap-4 hover:border-white/10 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-[#F6B32B]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#F6B32B] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{item.status}</span>
              </div>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
            <span className="material-symbols-outlined text-white/20 group-hover:text-white/40 transition-colors">chevron_right</span>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
          <p className="text-sm text-blue-300">Settings panel is configurable. Edit environment variables in <code className="bg-blue-500/20 px-1 rounded">.env</code> to update SMTP, JWT secret, and database credentials.</p>
        </div>
      </div>
    </div>
  );
}
