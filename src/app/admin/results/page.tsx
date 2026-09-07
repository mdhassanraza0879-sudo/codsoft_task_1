import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Award, ArrowLeft } from "lucide-react";

export default async function AdminResultsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const results = await prisma.result.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
      exam: {
        include: {
          subject: { select: { name: true, code: true } },
        },
      },
    },
  });

  return (
    <AppShell user={user} pageTitle="Academic Results & Grading">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Student Examination Results</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Marks scored, percentage evaluations, and letter grades
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Published Result Records"
          subtitle="Score ledger across all cohorts and exams"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Exam / Subject</th>
                <th className="px-6 py-3.5">Marks Scored</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Grade</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((r) => {
                const totalMarks = (r.exam as any).totalMarks || r.exam.maxMarks || 100;
                const pct = Math.round((r.marksObtained / totalMarks) * 100);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {r.student.user.name}
                    </td>
                    <td className="px-6 py-4">
                      {r.student.class.name} - Sec {r.student.class.section}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{(r.exam as any).title || r.exam.name}</div>
                      <div className="text-[11px] text-slate-400">{r.exam.subject.name} ({r.exam.subject.code})</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {r.marksObtained} / {totalMarks}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      {pct}%
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                        {r.grade || "A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">
                      {r.remarks || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
