import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAuth(req, ["ADMIN", "TEACHER"]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { specialization: { contains: search, mode: "insensitive" } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, avatarUrl: true } },
        classesAsHead: { select: { id: true, name: true, section: true } },
        subjects: {
          include: {
            class: { select: { id: true, name: true, section: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("Teachers list API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teacher directory." },
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
      password = "Teacher@1234",
      employeeId,
      phone,
      qualification,
      specialization,
      joiningDate = new Date(),
    } = body;

    if (!name || !email || !employeeId) {
      return NextResponse.json(
        { success: false, error: "Name, email, and employee ID are required." },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const existingEmp = await prisma.teacher.findUnique({
      where: { employeeId: employeeId.trim() },
    });
    if (existingEmp) {
      return NextResponse.json(
        { success: false, error: "Employee ID is already in use." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const teacher = await prisma.teacher.create({
      data: {
        employeeId: employeeId.trim(),
        phone: phone || null,
        qualification: qualification || null,
        specialization: specialization || null,
        joiningDate: new Date(joiningDate),
        user: {
          create: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "TEACHER",
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "TEACHER_REGISTERED",
        details: `Faculty member ${name} (${employeeId}) registered.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher added successfully.",
      data: teacher,
    });
  } catch (error) {
    console.error("Teacher create API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add teacher." },
      { status: 500 }
    );
  }
}
