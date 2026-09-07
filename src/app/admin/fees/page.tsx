import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, ArrowLeft, DollarSign } from "lucide-react";

export default async function AdminFeesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const fees = await prisma.fee.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
  });

  const totalBilled = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const outstanding = Math.max(0, totalBilled - totalPaid);

  return (
    <AppShell user={user} pageTitle="Fee Accounts & Billing">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Accounts & Finance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student tuition, lab fees, and institutional payment ledgers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Billed
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${totalBilled.toLocaleString()}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Collected Revenue
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            ${totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Outstanding Arrears
          </span>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            ${outstanding.toLocaleString()}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Student Invoicing Ledger"
          subtitle="All scheduled fees, transaction records, and settlement status"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Fee Title / Type</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Paid</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {f.student.user.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{f.title}</div>
                    <div className="text-[11px] text-slate-400">{f.feeType}</div>
                  </td>
                  <td className="px-6 py-4">
                    {f.student.class.name} - {f.student.class.section}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${f.amount}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    ${f.paidAmount}
                  </td>
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
