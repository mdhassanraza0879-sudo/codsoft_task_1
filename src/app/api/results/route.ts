import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    let studentId = searchParams.get("studentId");

    // Student can only see their own results
    if (user!.role === "STUDENT") {
      studentId = user!.studentId!;
    }

    const where: any = {};
    if (examId) where.examId = examId;
    if (studentId) where.studentId = studentId;

    const results = await prisma.result.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, section: true } },
          },
        },
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Results list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { examId, marks } = body;

    // Support single result or array of results: marks: [{ studentId, marksObtained, remarks }]
    if (!examId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { success: false, error: "examId and marks array are required." },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true, class: true },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    const operations = marks.map((entry: { studentId: string; marksObtained: number | string; remarks?: string }) => {
      const numericMarks = Number(entry.marksObtained);
      const grade = calculateGrade(numericMarks, exam.maxMarks);

      return prisma.result.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: entry.studentId,
          },
        },
        update: {
          marksObtained: numericMarks,
          grade,
          remarks: entry.remarks || null,
          updatedAt: new Date(),
        },
        create: {
          examId,
          studentId: entry.studentId,
          marksObtained: numericMarks,
          grade,
          remarks: entry.remarks || null,
        },
      });
    });

    await prisma.$transaction(operations);

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "RESULTS_ENTERED",
        details: `Recorded results for ${marks.length} students in ${exam.name} (${exam.subject.name}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Results saved successfully.",
      count: marks.length,
    });
  } catch (error) {
    console.error("Results save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record examination results." },
      { status: 500 }
    );
  }
}
