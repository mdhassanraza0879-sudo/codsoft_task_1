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

    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        classTeacher: {
          include: { user: { select: { name: true, email: true } } },
        },
        subjects: {
          include: {
            teacher: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        students: {
          where: { status: "ACTIVE" },
          orderBy: [{ rollNumber: "asc" }, { admissionNumber: "asc" }],
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cls,
    });
  } catch (error) {
    console.error("Class GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load class details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { name, section, roomNumber, capacity, classTeacherId } = body;

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        section: section !== undefined ? section.trim() : undefined,
        roomNumber: roomNumber !== undefined ? roomNumber : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        classTeacherId: classTeacherId !== undefined ? classTeacherId : undefined,
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
        action: "CLASS_UPDATED",
        details: `Updated class details for ${updated.name}-${updated.section}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Class PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update class." },
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
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    if (cls._count.students > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete class with enrolled students. Reassign students first." },
        { status: 400 }
      );
    }

    await prisma.class.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "CLASS_DELETED",
        details: `Deleted class ${cls.name}-${cls.section}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    console.error("Class DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete class." },
      { status: 500 }
    );
  }
}
