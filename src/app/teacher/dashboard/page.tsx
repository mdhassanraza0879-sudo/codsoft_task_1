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
  School,
  Users,
  CalendarCheck2,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function TeacherDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") {
    if (user.role === "ADMIN") redirect("/admin/dashboard");
    redirect("/student/dashboard");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      classesAsHead: {
        include: {
          _count: { select: { students: true } },
        },
      },
      subjects: {
        include: {
          class: true,
        },
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const classIds = Array.from(
    new Set([
      ...(teacher?.classesAsHead.map((c) => c.id) || []),
      ...(teacher?.subjects.map((s) => s.classId) || []),
    ])
  );

  const [enrolledStudentsCount, todayAttendanceForClasses, upcomingExams] =
    await Promise.all([
      prisma.student
        .count({
          where: { classId: { in: classIds }, status: "ACTIVE" },
        })
        .catch(() => 0),
      prisma.attendance
        .groupBy({
          by: ["status"],
          where: {
            classId: { in: classIds },
            date: { gte: today, lt: tomorrow },
          },
          _count: true,
        })
        .catch(() => [] as { status: any; _count: number }[]),
      prisma.exam
        .findMany({
          where: {
            classId: { in: classIds },
            examDate: { gte: today },
          },
          orderBy: { examDate: "asc" },
          take: 5,
          include: {
            class: { select: { name: true, section: true } },
            subject: { select: { name: true, code: true } },
          },
        })
        .catch(() => []),
    ]);

  const presentCount =
    (todayAttendanceForClasses || []).find((a) => a.status === "PRESENT")?._count || 0;
  const totalMarked = todayAttendanceForClasses.reduce((acc, curr) => acc + curr._count, 0);
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

  return (
    <AppShell user={user} pageTitle="Teacher Academic Portal">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-emerald-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Instructor Portal &middot; {teacher?.specialization || "Faculty"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name} 📚
          </h1>
          <p className="mt-1 text-sm text-emerald-200/80">
            Employee ID: <span className="font-semibold text-white">{teacher?.employeeId}</span> &middot; Manage your lessons, attendance, and exam grades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/10 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Enter Marks</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Classes"
          value={classIds.length}
          subtitle="Active instructional groups"
          icon={School}
          color="indigo"
        />
        <StatCard
          title="Taught Students"
          value={enrolledStudentsCount}
          subtitle="Enrolled under your subjects"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          subtitle={totalMarked > 0 ? `${presentCount}/${totalMarked} students present` : "No pending absentees"}
          icon={CalendarCheck2}
          color="sky"
        />
        <StatCard
          title="Scheduled Exams"
          value={upcomingExams.length}
          subtitle="Upcoming evaluations"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Main Grid: My Subjects & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects & Classes */}
        <Card>
          <CardHeader
            title="Curriculum & Subjects Taught"
            subtitle="Courses and assigned cohorts for this term"
          />
          <CardContent>
            {teacher?.subjects && teacher.subjects.length > 0 ? (
              <div className="space-y-3">
                {teacher.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{sub.name}</h4>
                        <span className="text-xs text-slate-500 font-medium">
                          Code: {sub.code} &middot; Class {sub.class.name}
                        </span>
                      </div>
                    </div>
                    <Badge variant="TEACHER" size="sm">
                      {sub.class.name} - Sec {sub.class.section}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">No assigned subjects found.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams List */}
        <Card>
          <CardHeader
            title="Upcoming Examinations"
            subtitle="Evaluation tests scheduled for your cohorts"
          />
          <CardContent>
            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{(exam as any).title || exam.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exam.subject.name} &middot; Class {exam.class.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(exam.examDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Max {(exam as any).totalMarks || exam.maxMarks || 100} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">No upcoming examinations scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
