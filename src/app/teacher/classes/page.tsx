import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { School, ArrowLeft, Users, BookOpen } from "lucide-react";

export default async function TeacherClassesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      classesAsHead: {
        include: {
          _count: { select: { students: true } },
          subjects: true,
        },
      },
      subjects: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const subjectClasses = teacher?.subjects.map((s) => ({
    id: s.class.id,
    name: s.class.name,
    section: s.class.section,
    subjectName: s.name,
    subjectCode: s.code,
    studentCount: s.class._count.students,
  })) || [];

  return (
    <AppShell user={user} pageTitle="Assigned Classes">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/teacher/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">My Teaching Cohorts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Classes and subjects assigned to your teaching timetable
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjectClasses.map((sc, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {sc.subjectCode}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Sec {sc.section}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mt-3">{sc.name}</h3>
              <p className="text-xs font-medium text-emerald-700 mt-0.5">{sc.subjectName}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Enrolled Students:</span>
                <span className="font-bold text-slate-900">{sc.studentCount} students</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/teacher/attendance"
                className="w-full py-2 flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                Mark Attendance
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
