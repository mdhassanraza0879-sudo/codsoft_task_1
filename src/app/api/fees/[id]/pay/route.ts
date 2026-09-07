import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { FeeStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAuth(req, ["ADMIN"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { amountPaid, transactionRef, remarks } = body;

    if (!amountPaid || Number(amountPaid) <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive payment amount is required." },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    if (!fee) {
      return NextResponse.json(
        { success: false, error: "Fee record not found" },
        { status: 404 }
      );
    }

    const newPaidAmount = fee.paidAmount + Number(amountPaid);
    const newStatus: FeeStatus =
      newPaidAmount >= fee.amount ? FeeStatus.PAID : FeeStatus.PARTIAL;

    const updated = await prisma.fee.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidDate: new Date(),
        transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
        remarks: remarks || fee.remarks,
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
        action: "FEE_PAYMENT_RECORDED",
        details: `Recorded payment of $${amountPaid} for ${updated.student.user.name} (${updated.title}). Ref: ${updated.transactionRef}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Fee payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record fee payment." },
      { status: 500 }
    );
  }
}
