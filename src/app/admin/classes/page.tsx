import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { School, ArrowLeft, Users, BookOpen } from "lucide-react";

export default async function AdminClassesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    include: {
      classTeacher: {
        include: { user: { select: { name: true, email: true } } },
      },
      students: {
        select: { id: true },
      },
      subjects: {
        include: {
          teacher: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <AppShell user={user} pageTitle="Classroom Management">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Classes & Cohorts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active grades, divisions, and homeroom teachers ({classes.length})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <Card key={c.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <span className="text-xs text-slate-500">Section {c.section}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                  {(c as any).academicyear || "2026-2027"}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Homeroom Teacher</span>
                  <span className="font-semibold text-slate-900">
                    {c.classTeacher?.user.name || "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-500">Enrolled Students:</span>
                  <span className="font-bold text-slate-900">{c.students.length} students</span>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-500">Active Subjects:</span>
                  <span className="font-bold text-slate-900">{c.subjects.length} subjects</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                href={`/admin/students?classId=${c.id}`}
                className="w-full py-2 flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <span>View Students</span>
                <Users className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
