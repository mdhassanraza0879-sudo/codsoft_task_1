import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { FeeType, FeeStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as FeeStatus | null;
    const classId = searchParams.get("classId");
    let studentId = searchParams.get("studentId");

    // Student can only see their own fees
    if (user!.role === "STUDENT") {
      studentId = user!.studentId!;
    }

    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (classId) {
      where.student = { classId };
    }

    const fees = await prisma.fee.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            class: { select: { id: true, name: true, section: true } },
          },
        },
      },
    });

    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalPending = Math.max(0, totalAmount - totalPaid);

    return NextResponse.json({
      success: true,
      data: fees,
      summary: {
        totalAmount,
        totalPaid,
        totalPending,
      },
    });
  } catch (error) {
    console.error("Fees list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch fee invoices." },
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
      title,
      feeType = FeeType.TUITION,
      amount,
      dueDate,
      studentId,
      classId, // if provided, generate fee invoice for all active students in class!
      remarks,
    } = body;

    if (!title || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: "Title, amount, and due date are required." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    const parsedDueDate = new Date(dueDate);

    // Case 1: Issue fee to an entire class
    if (classId && !studentId) {
      const students = await prisma.student.findMany({
        where: { classId, status: "ACTIVE" },
      });

      if (students.length === 0) {
        return NextResponse.json(
          { success: false, error: "No active students found in selected class." },
          { status: 400 }
        );
      }

      const feeCreates = students.map((s) =>
        prisma.fee.create({
          data: {
            studentId: s.id,
            title: title.trim(),
            feeType: feeType as FeeType,
            amount: numericAmount,
            dueDate: parsedDueDate,
            status: FeeStatus.PENDING,
            remarks: remarks || null,
          },
        })
      );

      await prisma.$transaction(feeCreates);

      await prisma.activityLog.create({
        data: {
          userId: user!.id,
          action: "FEES_ISSUED_CLASS",
          details: `Generated ${title} invoice of $${numericAmount} for ${students.length} students in class.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Invoiced ${students.length} students in class successfully.`,
      });
    }

    // Case 2: Issue fee to single student
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Either studentId or classId must be provided." },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.create({
      data: {
        studentId,
        title: title.trim(),
        feeType: feeType as FeeType,
        amount: numericAmount,
        dueDate: parsedDueDate,
        status: FeeStatus.PENDING,
        remarks: remarks || null,
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user!.id,
        action: "FEE_ISSUED_STUDENT",
        details: `Issued ${title} ($${numericAmount}) to ${fee.student.user.name}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fee invoice created successfully.",
      data: fee,
    });
  } catch (error) {
    console.error("Fee create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create fee record." },
      { status: 500 }
    );
  }
}
