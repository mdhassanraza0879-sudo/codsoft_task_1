import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // ADMIN STATS
    if (user!.role === "ADMIN") {
      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendance,
        feeAggregates,
        recentActivities,
        classesSummary,
      ] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.teacher.count({ where: { status: "ACTIVE" } }),
        prisma.class.count(),
        prisma.attendance.groupBy({
          by: ["status"],
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          _count: true,
        }),
        prisma.fee.aggregate({
          _sum: {
            amount: true,
            paidAmount: true,
          },
        }),
        prisma.activityLog.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, role: true } },
          },
        }),
        prisma.class.findMany({
          select: {
            id: true,
            name: true,
            section: true,
            _count: {
              select: { students: true },
            },
          },
        }),
      ]);

      const totalExpected = feeAggregates._sum.amount || 0;
      const totalCollected = feeAggregates._sum.paidAmount || 0;
      const pendingFees = Math.max(0, totalExpected - totalCollected);

      const presentCount =
        todayAttendance.find((a) => a.status === "PRESENT")?._count || 0;
      const totalMarkedToday = todayAttendance.reduce((acc, curr) => acc + curr._count, 0);
      const attendanceRate =
        totalMarkedToday > 0 ? Math.round((presentCount / totalMarkedToday) * 100) : 100;

      return NextResponse.json({
        success: true,
        role: "ADMIN",
        data: {
          totalStudents,
          totalTeachers,
          totalClasses,
          attendanceRate,
          todayPresent: presentCount,
          todayMarkedTotal: totalMarkedToday,
          totalExpectedFees: totalExpected,
          totalCollectedFees: totalCollected,
          pendingFees,
          recentActivities,
          classesSummary,
        },
      });
    }

    // TEACHER STATS
    if (user!.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user!.id },
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

      if (!teacher) {
        return NextResponse.json(
          { success: false, error: "Teacher profile not found" },
          { status: 404 }
        );
      }

      // Unique class IDs taught by teacher
      const classIds = Array.from(
        new Set([
          ...teacher.classesAsHead.map((c) => c.id),
          ...teacher.subjects.map((s) => s.classId),
        ])
      );

      const [enrolledStudentsCount, todayAttendanceForClasses, upcomingExams] =
        await Promise.all([
          prisma.student.count({
            where: { classId: { in: classIds }, status: "ACTIVE" },
          }),
          prisma.attendance.groupBy({
            by: ["status"],
            where: {
              classId: { in: classIds },
              date: { gte: today, lt: tomorrow },
            },
            _count: true,
          }),
          prisma.exam.findMany({
            where: {
              classId: { in: classIds },
              examDate: { gte: today },
            },
            orderBy: { examDate: "asc" },
            take: 4,
            include: {
              class: { select: { name: true, section: true } },
              subject: { select: { name: true, code: true } },
            },
          }),
        ]);

      const presentCount =
        todayAttendanceForClasses.find((a) => a.status === "PRESENT")?._count || 0;
      const totalMarked = todayAttendanceForClasses.reduce((acc, curr) => acc + curr._count, 0);

      return NextResponse.json({
        success: true,
        role: "TEACHER",
        data: {
          teacher,
          assignedClassesCount: classIds.length,
          totalStudents: enrolledStudentsCount,
          todayAttendanceRate:
            totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100,
          todayMarkedCount: totalMarked,
          upcomingExams,
        },
      });
    }

    // STUDENT STATS
    if (user!.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: user!.id },
        include: {
          class: true,
        },
      });

      if (!student) {
        return NextResponse.json(
          { success: false, error: "Student profile not found" },
          { status: 404 }
        );
      }

      const [attendances, subjects, upcomingExams, results, fees] = await Promise.all([
        prisma.attendance.findMany({
          where: { studentId: student.id },
          orderBy: { date: "desc" },
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
      const attendancePercentage =
        totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 100;

      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
      const paidFees = fees.reduce((sum, f) => sum + f.paidAmount, 0);
      const pendingFees = Math.max(0, totalFees - paidFees);

      return NextResponse.json({
        success: true,
        role: "STUDENT",
        data: {
          student,
          attendancePercentage,
          totalAttendanceDays,
          presentDays,
          subjectsCount: subjects.length,
          upcomingExams,
          recentResults: results,
          totalFees,
          paidFees,
          pendingFees,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
