"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Role } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string | null;
  };
  pageTitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  user,
  pageTitle = "Dashboard",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={user.name}
          userRole={user.role}
          pageTitle={pageTitle}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
