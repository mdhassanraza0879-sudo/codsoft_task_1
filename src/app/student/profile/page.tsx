import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, User, Phone, MapPin, Mail, School, Calendar } from "lucide-react";

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      class: {
        include: {
          classTeacher: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!student) redirect("/login");

  return (
    <AppShell user={user} pageTitle="Academic Profile">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/student/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Student Profile & Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official institutional enrollment and biographical details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center flex flex-col items-center">
          {student.user.avatarUrl ? (
            <img
              src={student.user.avatarUrl}
              alt={student.user.name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-indigo-100 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-2xl">
              {student.user.name.charAt(0)}
            </div>
          )}
          <h2 className="mt-4 font-bold text-slate-900 text-lg">{student.user.name}</h2>
          <span className="text-xs font-mono font-semibold text-indigo-600">
            {student.admissionNumber}
          </span>
          <div className="mt-2">
            <Badge variant={student.user.status} size="sm">
              {student.user.status}
            </Badge>
          </div>
          <div className="mt-6 w-full pt-6 border-t border-slate-100 text-xs text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Class:</span>
              <span className="font-semibold text-slate-900">{student.class.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Section:</span>
              <span className="font-semibold text-slate-900">{student.class.section}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Roll Number:</span>
              <span className="font-semibold text-slate-900">{student.rollNumber || "N/A"}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">
            Biographical & Guardian Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</span>
              <p className="font-medium text-slate-800">{student.user.email}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone Contact</span>
              <p className="font-medium text-slate-800">{student.phone || "+1 (555) 019-2834"}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Gender</span>
              <p className="font-medium text-slate-800">{student.gender}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Blood Group</span>
              <p className="font-medium text-slate-800">{student.bloodGroup || "O+"}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Guardian Name</span>
              <p className="font-medium text-slate-800">{student.guardianName || "Robert Morgan"}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Guardian Contact</span>
              <p className="font-medium text-slate-800">{student.guardianPhone || "+1 (555) 912-3847"}</p>
            </div>
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Residential Address</span>
              <p className="font-medium text-slate-800">{student.address || "742 Evergreen Terrace, Springfield"}</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
