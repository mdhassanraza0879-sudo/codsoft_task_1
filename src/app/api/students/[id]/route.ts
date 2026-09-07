import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { id } = await params;

    // Student can only view their own profile
    if (user!.role === "STUDENT" && user!.studentId !== id) {
      return NextResponse.json(
        { success: false, error: "Access denied. You can only view your own profile." },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, avatarUrl: true } },
        class: {
          include: {
            classTeacher: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: "desc" },
          include: { subject: { select: { name: true, code: true } } },
        },
        results: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            exam: {
              include: { subject: { select: { name: true, code: true } } },
            },
          },
        },
        fees: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Student GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load student details." },
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
      rollNumber,
      classId,
      dateOfBirth,
      gender,
      phone,
      address,
      guardianName,
      guardianPhone,
      bloodGroup,
      status,
    } = body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Update user and student
    const updated = await prisma.student.update({
      where: { id },
      data: {
        rollNumber: rollNumber !== undefined ? rollNumber : existingStudent.rollNumber,
        classId: classId || existingStudent.classId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingStudent.dateOfBirth,
        gender: gender || existingStudent.gender,
        phone: phone !== undefined ? phone : existingStudent.phone,
        address: address !== undefined ? address : existingStudent.address,
        guardianName: guardianName !== undefined ? guardianName : existingStudent.guardianName,
        guardianPhone: guardianPhone !== undefined ? guardianPhone : existingStudent.guardianPhone,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : existingStudent.bloodGroup,
        status: status || existingStudent.status,
        user: {
          update: {
            name: name !== undefined ? name.trim() : existingStudent.user.name,
            email: email !== undefined ? email.toLowerCase().trim() : existingStudent.user.email,
            status: status || existingStudent.user.status,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
        class: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "STUDENT_UPDATED",
        details: `Updated details for student ${updated.user.name} (${updated.admissionNumber}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Student PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update student." },
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
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Toggle active status to INACTIVE or delete user
    await prisma.student.update({
      where: { id },
      data: {
        status: "INACTIVE",
        user: { update: { status: "INACTIVE" } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "STUDENT_DEACTIVATED",
        details: `Deactivated student ${student.user.name} (${student.admissionNumber}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student deactivated successfully.",
    });
  } catch (error) {
    console.error("Student DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate student." },
      { status: 500 }
    );
  }
}
