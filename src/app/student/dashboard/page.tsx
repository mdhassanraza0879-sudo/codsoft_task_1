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
  GraduationCap,
  CalendarCheck2,
  BookOpen,
  Award,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  School,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") {
    if (user.role === "ADMIN") redirect("/admin/dashboard");
    redirect("/teacher/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      class: true,
    },
  });

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-800">
        Student profile not found. Please contact administration.
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [attendances, subjects, upcomingExams, results, fees] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.subject.findMany({
      where: { classId: student.classId },
      include: {
        teacher: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.exam.findMany({
      where: {
        classId: student.classId,
        examDate: { gte: today },
      },
      orderBy: { examDate: "asc" },
      take: 4,
      include: {
        subject: { select: { name: true, code: true } },
      },
    }),
    prisma.result.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        exam: {
          include: { subject: { select: { name: true, code: true } } },
        },
      },
    }),
    prisma.fee.findMany({
      where: { studentId: student.id },
    }),
  ]);

  const totalAttendanceDays = attendances.length;
  const presentDays = attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendanceRate =
    totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingFees = Math.max(0, totalFees - paidFees);

  return (
    <AppShell user={user} pageTitle="Student Learning Portal">
      {/* Student Profile Hero */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-sky-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold mb-2">
            <School className="w-3.5 h-3.5" />
            Class: {student.class.name} &middot; Section {student.class.section}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name} 🎓
          </h1>
          <p className="mt-1 text-sm text-sky-200/80">
            Admission No: <span className="font-semibold text-white">{student.admissionNumber}</span> &middot; Roll No: <span className="font-semibold text-white">{student.rollNumber || "N/A"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/fees"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay / View Fees</span>
          </Link>
          <Link
            href="/student/results"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/10 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Report Card</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Attendance"
          value={`${attendanceRate}%`}
          subtitle={`${presentDays} of ${totalAttendanceDays} days attended`}
          icon={CalendarCheck2}
          color="emerald"
          badge={{ text: "Good standing", trend: "up" }}
        />
        <StatCard
          title="Enrolled Subjects"
          value={subjects.length}
          subtitle="Academic curriculum"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Upcoming Exams"
          value={upcomingExams.length}
          subtitle="Scheduled evaluations"
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Fee Balance"
          value={pendingFees === 0 ? "Settled" : `$${pendingFees}`}
          subtitle={pendingFees === 0 ? "All term fees cleared" : `$${paidFees} paid so far`}
          icon={CreditCard}
          color={pendingFees === 0 ? "emerald" : "amber"}
          badge={{ text: pendingFees === 0 ? "Paid" : "Pending", trend: pendingFees === 0 ? "up" : "down" }}
        />
      </div>

      {/* Main Grid: Subjects & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses */}
        <Card>
          <CardHeader
            title="My Enrolled Subjects"
            subtitle="Current semester subjects & designated teachers"
          />
          <CardContent>
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{sub.name}</h4>
                      <p className="text-xs text-slate-500">
                        Instructor: {sub.teacher?.user.name || "TBA"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                    {sub.code}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Examination Results & Schedule */}
        <Card>
          <CardHeader
            title="Recent Exam Results"
            subtitle="Grades and percentage score breakdown"
          />
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((res) => {
                  const pct = Math.round((res.marksObtained / res.exam.totalMarks) * 100);
                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {res.exam.subject.name} &middot; {res.exam.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Grade Awarded: <span className="font-semibold text-slate-800">{res.grade || "A"}</span> &middot; {res.remarks || "Satisfactory"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-indigo-600 block">
                          {res.marksObtained} / {res.exam.totalMarks}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent examination results published yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
