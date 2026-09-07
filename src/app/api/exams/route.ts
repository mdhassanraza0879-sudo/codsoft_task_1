import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    // If student, scope to student's class
    if (user!.role === "STUDENT" && user!.classId) {
      where.classId = user!.classId;
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { examDate: "asc" },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { results: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Exams list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      name,
      term = "Fall 2026",
      classId,
      subjectId,
      examDate,
      startTime,
      endTime,
      maxMarks = 100,
      passingMarks = 40,
    } = body;

    if (!name || !classId || !subjectId || !examDate) {
      return NextResponse.json(
        { success: false, error: "Exam name, class, subject, and date are required." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        term: term.trim(),
        classId,
        subjectId,
        examDate: new Date(examDate),
        startTime: startTime?.trim() || null,
        endTime: endTime?.trim() || null,
        maxMarks: Number(maxMarks) || 100,
        passingMarks: Number(passingMarks) || 40,
      },
      include: {
        class: true,
        subject: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "EXAM_SCHEDULED",
        details: `Scheduled ${name} for ${exam.subject.name} (${exam.class.name}-${exam.class.section}) on ${examDate}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam scheduled successfully.",
      data: exam,
    });
  } catch (error) {
    console.error("Exam create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to schedule exam." },
      { status: 500 }
    );
  }
}
