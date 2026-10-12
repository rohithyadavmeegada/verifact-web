"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  Cpu, 
  FlaskConical, 
  Activity, 
  History, 
  User, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { getStoredUser, clearStoredToken, UserSession } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/analyze", label: "Analyze", icon: ShieldCheck },
    { href: "/how-it-works", label: "How It Works", icon: Cpu },
    { href: "/research", label: "Research", icon: FlaskConical },
    { href: "/lab", label: "Laboratory", icon: Activity },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-cyan-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#070b16] rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
              Veri<span className="text-cyan-400">Fact</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / User State */}
        <div className="hidden md:flex items-center gap-3">
          {/* Provider / Demo Active Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Demo AI Engine
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 font-medium">
                  {user.is_demo ? "Guest Researcher" : user.name || user.email}
                </span>
                {user.is_demo && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    DEMO
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sign In / Demo
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-500/15 bg-[#080d1a] px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Signed in as {user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:underline font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold"
              >
                Sign In / Guest Demo
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
