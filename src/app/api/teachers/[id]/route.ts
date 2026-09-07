import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, avatarUrl: true } },
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
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Teacher GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load teacher details." },
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
    const {
      name,
      email,
      phone,
      qualification,
      specialization,
      status,
    } = body;

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        phone: phone !== undefined ? phone : existingTeacher.phone,
        qualification: qualification !== undefined ? qualification : existingTeacher.qualification,
        specialization: specialization !== undefined ? specialization : existingTeacher.specialization,
        status: status || existingTeacher.status,
        user: {
          update: {
            name: name !== undefined ? name.trim() : existingTeacher.user.name,
            email: email !== undefined ? email.toLowerCase().trim() : existingTeacher.user.email,
            status: status || existingTeacher.user.status,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "TEACHER_UPDATED",
        details: `Updated details for teacher ${updated.user.name} (${updated.employeeId}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Teacher PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update teacher." },
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
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    await prisma.teacher.update({
      where: { id },
      data: {
        status: "INACTIVE",
        user: { update: { status: "INACTIVE" } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "TEACHER_DEACTIVATED",
        details: `Deactivated teacher ${teacher.user.name} (${teacher.employeeId}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher deactivated successfully.",
    });
  } catch (error) {
    console.error("Teacher DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate teacher." },
      { status: 500 }
    );
  }
}
