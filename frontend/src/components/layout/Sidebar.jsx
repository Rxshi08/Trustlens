import { NavLink } from "react-router-dom";
import { getUser, logout } from "../../utils/auth";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

function Sidebar({ onNavigate }) {
  const user = getUser();

  const nav = {
    admin: [
      { to: "/dashboard", label: "Overview", icon: "📊" },
      { to: "/analytics", label: "Analytics", icon: "📈" },
      { to: "/upload", label: "Verify Docs", icon: "📄" }
    ],
    recruiter: [
      { to: "/recruiter", label: "Review Queue", icon: "👥" },
      { to: "/analytics", label: "Analytics", icon: "📈" }
    ],
    candidate: [
      { to: "/candidate", label: "My Dashboard", icon: "🏠" },
      { to: "/upload", label: "Upload Docs", icon: "📤" },
      { to: "/history", label: "History", icon: "🕐" }
    ]
  };

  const links = nav[user?.role] || nav.candidate;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-slate-950">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
          TL
        </div>
        <div>
          <p className="text-sm font-bold text-white">TrustLens</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Verify & Trust</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
