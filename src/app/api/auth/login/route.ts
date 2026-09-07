import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
        avatarUrl: true,
        studentProfile: {
          select: { id: true, classId: true, admissionNumber: true },
        },
        teacherProfile: {
          select: { id: true, employeeId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Your account is deactivated. Contact administrator." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      studentId: user.studentProfile?.id,
      teacherId: user.teacherProfile?.id,
      classId: user.studentProfile?.classId,
    };

    await setSessionCookie(sessionPayload);

    // Record login activity in background without blocking login response
    prisma.activityLog
      .create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          details: `${user.name} (${user.role}) logged in successfully.`,
        },
      })
      .catch((err) => console.error("ActivityLog error:", err));

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: sessionPayload,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred during login." },
      { status: 500 }
    );
  }
}
