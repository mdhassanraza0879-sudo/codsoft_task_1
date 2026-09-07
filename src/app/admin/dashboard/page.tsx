import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  UserCheck,
  School,
  CalendarCheck2,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Award,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") {
    if (user.role === "TEACHER") redirect("/teacher/dashboard");
    redirect("/student/dashboard");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Batch 1: Primary counts (uses max 3 pooled connections)
  const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    prisma.teacher.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    prisma.class.count().catch(() => 0),
  ]);

  // Batch 2: Aggregations (uses max 2 pooled connections)
  const [todayAttendance, feeAggregates] = await Promise.all([
    prisma.attendance
      .groupBy({
        by: ["status"],
        where: {
          date: { gte: today, lt: tomorrow },
        },
        _count: true,
      })
      .catch(() => [] as { status: any; _count: number }[]),
    prisma.fee
      .aggregate({
        _sum: { amount: true, paidAmount: true },
      })
      .catch(() => ({ _sum: { amount: 0, paidAmount: 0 } })),
  ]);

  // Batch 3: Activity & Class Summary (uses max 2 pooled connections)
  const [recentActivities, classesSummary] = await Promise.all([
    prisma.activityLog
      .findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          details: true,
          createdAt: true,
          user: { select: { name: true, role: true } },
        },
      })
      .catch(() => []),
    prisma.class
      .findMany({
        select: {
          id: true,
          name: true,
          section: true,
          _count: {
            select: { students: true },
          },
        },
      })
      .catch(() => []),
  ]);

  const totalExpected = feeAggregates?._sum?.amount || 0;
  const totalCollected = feeAggregates?._sum?.paidAmount || 0;
  const pendingFees = Math.max(0, totalExpected - totalCollected);

  const presentCount = todayAttendance?.find?.((a) => a.status === "PRESENT")?._count || 0;
  const totalMarked = (todayAttendance || []).reduce((acc, curr) => acc + (curr._count || 0), 0);
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

  return (
    <AppShell user={user} pageTitle="Administrator Dashboard">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Academic Session 2026-27
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-indigo-200/80">
            System overview and central administrative controls. All modules operational.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Students</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/10 transition-all"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Attendance</span>
          </Link>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled active learners"
          icon={Users}
          color="indigo"
          badge={{ text: "Active", trend: "up" }}
        />
        <StatCard
          title="Faculty Members"
          value={totalTeachers}
          subtitle="Full-time teaching staff"
          icon={UserCheck}
          color="emerald"
          badge={{ text: "Verified", trend: "neutral" }}
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          subtitle={totalMarked > 0 ? `${presentCount}/${totalMarked} recorded today` : "Full presence recorded"}
          icon={CalendarCheck2}
          color="sky"
          badge={{ text: "Today", trend: "up" }}
        />
        <StatCard
          title="Fee Revenue"
          value={`$${totalCollected.toLocaleString()}`}
          subtitle={`$${pendingFees.toLocaleString()} remaining balance`}
          icon={CreditCard}
          color="amber"
          badge={{ text: `${Math.round((totalCollected / (totalExpected || 1)) * 100)}% Collected`, trend: "up" }}
        />
      </div>

      {/* Main Content Grid: Classes & Quick Actions & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Classes Summary & Management Panels */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Classrooms & Student Allocation"
              subtitle="Active sections and enrolled cohort counts"
              action={
                <Link
                  href="/admin/classes"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  View all classes <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {classesSummary.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-xs">
                          <School className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Sec {cls.section}
                        </span>
                      </div>
                      <h4 className="mt-3 font-bold text-slate-900 text-sm">
                        {cls.name}
                      </h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Students</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {cls._count.students}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/admin/students"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-800">Student Directory</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Profiles & enrollments</span>
            </Link>

            <Link
              href="/admin/teachers"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-800">Faculty Staff</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Departments & logs</span>
            </Link>

            <Link
              href="/admin/exams"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-800">Examinations</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Schedules & grading</span>
            </Link>

            <Link
              href="/admin/fees"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-800">Fee Accounts</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Invoicing & receipts</span>
            </Link>
          </div>
        </div>

        {/* Right Col: Recent System Audit / Activity Log */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Recent Activity"
              subtitle="Audited administrative actions"
            />
            <CardContent className="flex-1">
              <div className="space-y-4">
                {recentActivities.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {log.user.name}
                        </span>
                        <Badge variant={log.user.role} size="sm">
                          {log.user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {log.details}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
