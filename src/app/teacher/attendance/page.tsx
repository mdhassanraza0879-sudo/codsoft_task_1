import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarCheck2, ArrowLeft } from "lucide-react";

export default async function TeacherAttendancePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: { subjects: true, classesAsHead: true },
  });

  const classIds = Array.from(
    new Set([
      ...(teacher?.classesAsHead.map((c) => c.id) || []),
      ...(teacher?.subjects.map((s) => s.classId) || []),
    ])
  );

  const attendances = await prisma.attendance.findMany({
    where: { classId: { in: classIds } },
    orderBy: { date: "desc" },
    take: 25,
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  return (
    <AppShell user={user} pageTitle="Classroom Attendance">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/teacher/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily logs and roll-call records for your assigned cohorts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Recorded Attendance Logs"
          subtitle="Recent roll calls for your assigned classes"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {a.student.user.name}
                  </td>
                  <td className="px-6 py-4">
                    {a.student.class.name} - Sec {a.student.class.section}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(a.date).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={a.status} size="sm">
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic">
                    {a.remarks || "Regular session"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
