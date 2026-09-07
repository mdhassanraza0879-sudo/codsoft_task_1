import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            students: {
              where: { status: "ACTIVE" },
              orderBy: [{ rollNumber: "asc" }, { admissionNumber: "asc" }],
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        subject: true,
        results: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    // Combine student list with their result if already recorded
    const rosterWithMarks = exam.class.students.map((student) => {
      const res = exam.results.find((r) => r.studentId === student.id);
      return {
        student,
        resultId: res?.id || null,
        marksObtained: res?.marksObtained ?? "",
        grade: res?.grade || "",
        remarks: res?.remarks || "",
        isSubmitted: !!res,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        exam,
        rosterWithMarks,
      },
    });
  } catch (error) {
    console.error("Exam GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load exam details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { name, term, examDate, startTime, endTime, maxMarks, passingMarks } = body;

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        term: term !== undefined ? term.trim() : undefined,
        examDate: examDate ? new Date(examDate) : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        maxMarks: maxMarks !== undefined ? Number(maxMarks) : undefined,
        passingMarks: passingMarks !== undefined ? Number(passingMarks) : undefined,
      },
      include: { class: true, subject: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "EXAM_UPDATED",
        details: `Updated exam ${updated.name} for ${updated.subject.name}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Exam PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exam." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const exam = await prisma.exam.findUnique({ where: { id } });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    await prisma.exam.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "EXAM_DELETED",
        details: `Deleted exam ${exam.name}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    console.error("Exam DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete exam." },
      { status: 500 }
    );
  }
}
