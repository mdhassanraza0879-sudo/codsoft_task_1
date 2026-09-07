import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const classes = await prisma.class.findMany({
      orderBy: [{ name: "asc" }, { section: "asc" }],
      include: {
        classTeacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error("Classes list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch classes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, section, roomNumber, capacity = 40, classTeacherId } = body;

    if (!name || !section) {
      return NextResponse.json(
        { success: false, error: "Class name and section are required." },
        { status: 400 }
      );
    }

    // Check unique [name, section]
    const existing = await prisma.class.findUnique({
      where: {
        name_section: {
          name: name.trim(),
          section: section.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Class ${name}-${section} already exists.` },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        section: section.trim(),
        roomNumber: roomNumber?.trim() || null,
        capacity: Number(capacity) || 40,
        classTeacherId: classTeacherId || null,
      },
      include: {
        classTeacher: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "CLASS_CREATED",
        details: `Created new class section ${name}-${section}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class created successfully.",
      data: newClass,
    });
  } catch (error) {
    console.error("Class create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create class." },
      { status: 500 }
    );
  }
}
