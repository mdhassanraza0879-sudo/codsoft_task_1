"use client";

import React from "react";
import { Menu, LogOut, Bell, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Role } from "@/types";
import { Badge } from "../ui/Badge";

interface NavbarProps {
  onOpenSidebar: () => void;
  userName: string;
  userRole: Role;
  pageTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  userName,
  userRole,
  pageTitle = "Portal",
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: mobile hamburger & breadcrumb title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
            EduVanguard
          </span>
          <span className="text-slate-300 hidden sm:inline-block">/</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right section: System Status, Role Badge, Quick Logout */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>

        <Badge variant={userRole} size="md">
          {userRole}
        </Badge>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 hidden sm:inline-block">
            {userName}
          </span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
