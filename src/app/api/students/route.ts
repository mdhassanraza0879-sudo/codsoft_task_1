import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status as "ACTIVE" | "INACTIVE";
    }

    if (search) {
      where.OR = [
        { admissionNumber: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, status: true, avatarUrl: true },
          },
          class: {
            select: { id: true, name: true, section: true },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Students list API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student directory." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      name,
      email,
      password = "Student@1234",
      admissionNumber,
      rollNumber,
      classId,
      dateOfBirth,
      gender = "Male",
      phone,
      address,
      guardianName,
      guardianPhone,
      bloodGroup,
    } = body;

    if (!name || !email || !admissionNumber || !classId || !dateOfBirth) {
      return NextResponse.json(
        { success: false, error: "Name, email, admission number, class, and date of birth are required." },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    // Check admissionNumber uniqueness
    const existingAdm = await prisma.student.findUnique({
      where: { admissionNumber: admissionNumber.trim() },
    });
    if (existingAdm) {
      return NextResponse.json(
        { success: false, error: "Admission number is already in use." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const student = await prisma.student.create({
      data: {
        admissionNumber: admissionNumber.trim(),
        rollNumber: rollNumber?.trim() || null,
        classId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone: phone || null,
        address: address || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        bloodGroup: bloodGroup || null,
        user: {
          create: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "STUDENT",
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        class: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "STUDENT_ENROLLED",
        details: `Student ${name} (${admissionNumber}) enrolled in ${student.class.name}-${student.class.section}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student enrolled successfully.",
      data: student,
    });
  } catch (error) {
    console.error("Student create API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to enroll student." },
      { status: 500 }
    );
  }
}
