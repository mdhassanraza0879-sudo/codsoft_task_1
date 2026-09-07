import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function StudentFeesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
  });
  if (!student) redirect("/login");

  const fees = await prisma.fee.findMany({
    where: { studentId: student.id },
    orderBy: { dueDate: "asc" },
  });

  const totalBilled = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const balance = Math.max(0, totalBilled - totalPaid);

  return (
    <AppShell user={user} pageTitle="Fee Accounts">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/student/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Student Fee Account</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tuition fee statement and outstanding payment status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Assessment</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">${totalBilled}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Total Settled</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">${totalPaid}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-amber-600 uppercase">Outstanding Due</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">${balance}</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Scheduled Invoices"
          subtitle="Itemized fee breakdown and payment status"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Fee Title</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Paid Amount</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{f.title}</td>
                  <td className="px-6 py-4">{f.feeType}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">${f.amount}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">${f.paidAmount}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(f.dueDate).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={f.status} size="sm">
                      {f.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
