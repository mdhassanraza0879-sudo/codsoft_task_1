import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileSpreadsheet, ArrowLeft, Clock } from "lucide-react";

export default async function AdminExamsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const exams = await prisma.exam.findMany({
    orderBy: { examDate: "asc" },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } },
      results: { select: { id: true } },
    },
  });

  return (
    <AppShell user={user} pageTitle="Institutional Examinations">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Examinations & Assessments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test timetables, subject assessments, and grading periods
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.map((ex) => (
          <Card key={ex.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {ex.subject.code}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {ex.class.name} - Sec {ex.class.section}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-3">{(ex as any).title || (ex as any).name || "Exam"}</h3>
              <p className="text-xs text-slate-500">{ex.subject.name}</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Exam Date:
                  </span>
                  <span className="font-medium text-slate-900">
                    {new Date(ex.examDate).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Marks:</span>
                  <span className="font-bold text-indigo-600">{ex.totalMarks} pts</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Passing Marks:</span>
                  <span className="font-bold text-slate-700">{ex.passingMarks} pts</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Results Recorded:</span>
              <span className="font-bold text-slate-800">{ex.results.length} students</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
