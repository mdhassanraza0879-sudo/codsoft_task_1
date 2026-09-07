import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserCheck, ArrowLeft, BookOpen, Mail, Phone } from "lucide-react";

export default async function AdminTeachersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const teachers = await prisma.teacher.findMany({
    orderBy: { employeeId: "asc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, status: true, avatarUrl: true },
      },
      subjects: {
        include: { class: true },
      },
      classesAsHead: true,
    },
  });

  return (
    <AppShell user={user} pageTitle="Faculty Staff Directory">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Staff Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active instructors and department specialists ({teachers.length})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((t) => (
          <Card key={t.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {t.user.avatarUrl ? (
                    <img
                      src={t.user.avatarUrl}
                      alt={t.user.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-base">
                      {t.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.user.name}</h3>
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                      {t.employeeId}
                    </span>
                  </div>
                </div>
                <Badge variant={t.user.status} size="sm">
                  {t.user.status}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.user.email}</span>
                </div>
                {t.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.phone}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Specialization
                  </p>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {t.specialization || "General Faculty"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Subjects Assigned</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {t.subjects.length} courses
              </span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
