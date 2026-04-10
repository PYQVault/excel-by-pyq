import { useState } from "react";
import {
  Sun,
  Moon,
  Zap,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Home,
  Shield,MessageSquare
} from "lucide-react";
import useTheme from "@/hooks/useTheme";
import useAuth from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from './Logo'

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo — always goes to /dashboard if logged in, else landing */}
          <Logo size="lg" />
          {/* Right side */}
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all"
              >
                <Shield size={13} />
                Admin
              </button>
            )}
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Desktop — Home link */}
            {user && (
              <button
                onClick={() => navigate("/")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              >
                <Home size={13} />
                Home
              </button>
            )}

            {/* Desktop user info */}
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-none">
                    {user.email}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            {user && (
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && user && (
        <div className="sm:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          {/* User info */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Home */}
          <button
            onClick={() => {
              navigate("/");
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-1"
          >
            <Home size={16} className="text-blue-500" />
            Landing Page
          </button>

          {/* Dashboard */}
          <button
            onClick={() => {
              navigate("/dashboard");
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-1"
          >
            <LayoutDashboard size={16} className="text-blue-500" />
            Dashboard
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => {
                navigate("/admin");
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors mb-1"
            >
              <Shield size={16} />
              Admin Panel
            </button>
          )}

<button
  onClick={() => { navigate('/feedback'); setMenuOpen(false) }}
  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-1"
>
  <MessageSquare size={16} className="text-blue-500" />
  Feedback
</button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
