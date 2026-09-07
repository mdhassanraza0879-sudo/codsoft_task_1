import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const teacherId = searchParams.get("teacherId");

    const where: any = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        class: { select: { id: true, name: true, section: true } },
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("Subjects list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subjects." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, code, description, classId, teacherId } = body;

    if (!name || !code || !classId) {
      return NextResponse.json(
        { success: false, error: "Subject name, code, and class are required." },
        { status: 400 }
      );
    }

    const existingCode = await prisma.subject.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Subject code '${code}' is already in use.` },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        classId,
        teacherId: teacherId || null,
      },
      include: {
        class: true,
        teacher: { include: { user: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "SUBJECT_CREATED",
        details: `Created subject ${name} (${code}) for class ${subject.class.name}-${subject.class.section}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subject created successfully.",
      data: subject,
    });
  } catch (error) {
    console.error("Subject create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subject." },
      { status: 500 }
    );
  }
}
