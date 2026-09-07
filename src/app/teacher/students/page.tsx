import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";

export default async function TeacherStudentsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      subjects: true,
      classesAsHead: true,
    },
  });

  const classIds = Array.from(
    new Set([
      ...(teacher?.classesAsHead.map((c) => c.id) || []),
      ...(teacher?.subjects.map((s) => s.classId) || []),
    ])
  );

  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    include: {
      user: { select: { name: true, email: true, status: true, avatarUrl: true } },
      class: { select: { name: true, section: true } },
    },
    orderBy: { rollNumber: "asc" },
  });

  return (
    <AppShell user={user} pageTitle="Student Roster">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/teacher/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Enrolled Students Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Learners attending classes within your teaching assignments ({students.length})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Classroom Learners"
          subtitle="Students enrolled across your assigned cohorts"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Admission No</th>
                <th className="px-6 py-3.5">Class / Section</th>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Gender</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {st.user.avatarUrl ? (
                      <img
                        src={st.user.avatarUrl}
                        alt={st.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {st.user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{st.user.name}</div>
                      <div className="text-[11px] text-slate-400">{st.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-emerald-700">
                    {st.admissionNumber}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {st.class.name} - Sec {st.class.section}
                  </td>
                  <td className="px-6 py-4 font-medium">{st.rollNumber || "—"}</td>
                  <td className="px-6 py-4">{st.gender}</td>
                  <td className="px-6 py-4">
                    <Badge variant={st.user.status} size="sm">
                      {st.user.status}
                    </Badge>
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
