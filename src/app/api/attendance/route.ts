import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const dateStr = searchParams.get("date");
    const subjectId = searchParams.get("subjectId");
    let studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // If student role, force studentId to their own id
    if (user!.role === "STUDENT") {
      studentId = user!.studentId!;
    }

    // 1. Single Student Attendance query
    if (studentId) {
      const records = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true, code: true } },
        },
      });

      const total = records.length;
      const present = records.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE"
      ).length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;

      return NextResponse.json({
        success: true,
        data: {
          records,
          summary: {
            total,
            present,
            absent: records.filter((r) => r.status === "ABSENT").length,
            late: records.filter((r) => r.status === "LATE").length,
            excused: records.filter((r) => r.status === "EXCUSED").length,
            rate,
          },
        },
      });
    }

    // 2. Class & Date Attendance roster (for Teacher/Admin marking or viewing)
    if (classId && dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);

      // Get enrolled students in this class
      const students = await prisma.student.findMany({
        where: { classId, status: "ACTIVE" },
        orderBy: [{ rollNumber: "asc" }, { admissionNumber: "asc" }],
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      // Get existing attendance records for this date
      const attendanceWhere: any = {
        classId,
        date: targetDate,
      };
      if (subjectId) {
        attendanceWhere.subjectId = subjectId;
      }

      const existingRecords = await prisma.attendance.findMany({
        where: attendanceWhere,
      });

      // Map students with their attendance status
      const roster = students.map((student) => {
        const record = existingRecords.find((r) => r.studentId === student.id);
        return {
          student,
          status: record ? record.status : "PRESENT", // default to PRESENT if not marked yet
          isMarked: !!record,
          remarks: record?.remarks || "",
          attendanceId: record?.id || null,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          roster,
          date: targetDate,
          classId,
          subjectId,
          alreadyMarked: existingRecords.length > 0,
        },
      });
    }

    // 3. School-wide or Date-range Attendance Reports (Admin)
    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      take: 100,
      orderBy: { date: "desc" },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        class: { select: { name: true, section: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Attendance query error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve attendance records." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { classId, date, subjectId, records } = body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: "classId, date, and attendance records array are required." },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Upsert all student attendance records in a transaction to prevent duplicates
    const operations = records.map((item: { studentId: string; status: AttendanceStatus; remarks?: string }) => {
      return prisma.attendance.upsert({
        where: {
          studentId_classId_date_subjectId: {
            studentId: item.studentId,
            classId,
            date: attendanceDate,
            subjectId: subjectId || null,
          },
        },
        update: {
          status: item.status,
          remarks: item.remarks || null,
          markedById: user!.id,
          updatedAt: new Date(),
        },
        create: {
          studentId: item.studentId,
          classId,
          subjectId: subjectId || null,
          date: attendanceDate,
          status: item.status,
          remarks: item.remarks || null,
          markedById: user!.id,
        },
      });
    });

    await prisma.$transaction(operations);

    // Log the attendance activity
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "ATTENDANCE_MARKED",
        details: `Attendance marked for ${cls ? `${cls.name}-${cls.section}` : "class"} on ${attendanceDate.toISOString().split("T")[0]} (${records.length} students).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance saved successfully.",
      count: records.length,
    });
  } catch (error) {
    console.error("Attendance save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save attendance." },
      { status: 500 }
    );
  }
}
