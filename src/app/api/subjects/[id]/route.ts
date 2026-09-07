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
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        class: true,
        teacher: { include: { user: true } },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Subject GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load subject." },
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
    const { name, code, description, classId, teacherId } = body;

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        code: code !== undefined ? code.trim().toUpperCase() : undefined,
        description: description !== undefined ? description : undefined,
        classId: classId !== undefined ? classId : undefined,
        teacherId: teacherId !== undefined ? teacherId : undefined,
      },
      include: {
        class: true,
        teacher: { include: { user: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "SUBJECT_UPDATED",
        details: `Updated subject ${updated.name} (${updated.code}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subject updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Subject PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subject." },
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
    const subject = await prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    await prisma.subject.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "SUBJECT_DELETED",
        details: `Deleted subject ${subject.name} (${subject.code}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subject deleted successfully.",
    });
  } catch (error) {
    console.error("Subject DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete subject." },
      { status: 500 }
    );
  }
}
