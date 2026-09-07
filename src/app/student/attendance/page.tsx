import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarCheck2, ArrowLeft } from "lucide-react";

export default async function StudentAttendancePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });
  if (!student) redirect("/login");

  const attendances = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
  });

  const presentDays = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const pct = attendances.length > 0 ? Math.round((presentDays / attendances.length) * 100) : 100;

  return (
    <AppShell user={user} pageTitle="Attendance History">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/student/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your cumulative attendance record across all academic sessions
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 px-5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Overall Standing</span>
            <div className="text-lg font-bold text-emerald-600">{pct}% Attended</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Days</span>
            <div className="text-lg font-bold text-slate-800">{attendances.length} Days</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Daily Attendance Records"
          subtitle="Timestamped presence markings"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {new Date(a.date).toLocaleDateString([], {
                      weekday: "short",
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
