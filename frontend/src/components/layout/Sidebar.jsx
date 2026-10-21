import { FiCheckSquare, FiHome, FiPlus } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { to: "/home", label: "Dashboard", icon: FiHome, end: true },
  { to: "/tasks", label: "My Todos", icon: FiCheckSquare, end: true },
  { to: "/tasks/new", label: "Add Task", icon: FiPlus, end: false },
];

export function SideNav({ onNavigate, user }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo />
        <div>
          <p className="text-base font-semibold">Taskboard</p>
          <p className="text-xs text-sidebar-muted">Personal tasks</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-sidebar-muted hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon aria-hidden="true" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {user ? (
        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar({ open, onClose, user }) {
  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
        <SideNav user={user} />
      </div>

      {open ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-slate-950/50"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72">
            <SideNav user={user} onNavigate={onClose} />
          </div>
        </div>
      ) : null}
    </>
  );
}
