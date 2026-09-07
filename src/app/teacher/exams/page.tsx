import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Award, ArrowLeft, Clock } from "lucide-react";

export default async function TeacherExamsPage() {
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

  const exams = await prisma.exam.findMany({
    where: { classId: { in: classIds } },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } },
      results: {
        include: {
          student: { include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { examDate: "desc" },
  });

  return (
    <AppShell user={user} pageTitle="Exam Management & Marks">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/teacher/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Examinations & Mark Sheets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort evaluations and graded test results
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {exams.map((ex) => {
          const totalMarks = (ex as any).totalMarks || ex.maxMarks || 100;
          return (
            <Card key={ex.id}>
              <CardHeader
                title={`${(ex as any).title || ex.name} — ${ex.subject.name} (${ex.subject.code})`}
                subtitle={`Class ${ex.class.name} - Sec ${ex.class.section} | Max Marks: ${totalMarks} pts | Date: ${new Date(ex.examDate).toLocaleDateString()}`}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Marks Scored</th>
                      <th className="px-6 py-3">Percentage</th>
                      <th className="px-6 py-3">Grade</th>
                      <th className="px-6 py-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ex.results.map((r) => {
                      const pct = Math.round((r.marksObtained / totalMarks) * 100);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-3 font-semibold text-slate-900">
                            {r.student.user.name}
                          </td>
                          <td className="px-6 py-3 font-bold text-slate-900">
                            {r.marksObtained} / {totalMarks}
                          </td>
                        <td className="px-6 py-3 font-bold text-emerald-600">
                          {pct}%
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                            {r.grade || "A"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500 italic">
                          {r.remarks || "Good performance"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
    </AppShell>
  );
}
