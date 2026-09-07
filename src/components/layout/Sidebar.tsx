"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  School,
  BookOpen,
  CalendarCheck2,
  FileSpreadsheet,
  Award,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Role } from "@/types";
import { Badge } from "../ui/Badge";

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  userName,
  userEmail,
  avatarUrl,
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    }
  };

  // Role Navigation Links
  const adminNav = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Teachers", href: "/admin/teachers", icon: UserCheck },
    { name: "Classes", href: "/admin/classes", icon: School },
    { name: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { name: "Attendance", href: "/admin/attendance", icon: CalendarCheck2 },
    { name: "Examinations", href: "/admin/exams", icon: FileSpreadsheet },
    { name: "Results", href: "/admin/results", icon: Award },
    { name: "Fees & Finance", href: "/admin/fees", icon: CreditCard },
  ];

  const teacherNav = [
    { name: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "My Classes", href: "/teacher/classes", icon: School },
    { name: "Students", href: "/teacher/students", icon: Users },
    { name: "Mark Attendance", href: "/teacher/attendance", icon: CalendarCheck2 },
    { name: "Enter Marks", href: "/teacher/exams", icon: Award },
  ];

  const studentNav = [
    { name: "My Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Academic Profile", href: "/student/profile", icon: Users },
    { name: "Attendance Log", href: "/student/attendance", icon: CalendarCheck2 },
    { name: "Enrolled Subjects", href: "/student/subjects", icon: BookOpen },
    { name: "Exam Schedule", href: "/student/exams", icon: FileSpreadsheet },
    { name: "Report Card", href: "/student/results", icon: Award },
    { name: "Fee Status", href: "/student/fees", icon: CreditCard },
  ];

  const navItems =
    userRole === "ADMIN" ? adminNav : userRole === "TEACHER" ? teacherNav : studentNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white">
              EduVanguard
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Student Mgmt System
            </span>
          </div>
        </div>

        {/* User Role Card */}
        <div className="px-5 py-3.5 mx-3 mt-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover border border-slate-600"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              {userName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <div className="mt-0.5">
              <Badge variant={userRole} size="sm">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
