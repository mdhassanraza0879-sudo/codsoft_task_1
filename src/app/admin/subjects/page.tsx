import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { BookOpen, ArrowLeft } from "lucide-react";

export default async function AdminSubjectsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const subjects = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    include: {
      class: { select: { name: true, section: true } },
      teacher: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <AppShell user={user} pageTitle="Curriculum & Subjects">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Subjects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional course offerings, assigned faculties, and syllabus codes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  {s.code}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {s.class.name} - Sec {s.class.section}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-3">{s.name}</h3>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Assigned Instructor
                </span>
                <p className="font-semibold text-slate-800">
                  {s.teacher?.user.name || "TBA"}
                </p>
                <p className="text-slate-400 text-[11px]">{s.teacher?.user.email || ""}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
