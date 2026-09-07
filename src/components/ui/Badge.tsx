import React from "react";

export type BadgeVariant =
  | "ACTIVE"
  | "INACTIVE"
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED"
  | "PAID"
  | "PARTIAL"
  | "PENDING"
  | "OVERDUE"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  size = "md",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  const variantStyles: Record<BadgeVariant, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    INACTIVE: "bg-slate-100 text-slate-600 border border-slate-200",
    PRESENT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    ABSENT: "bg-rose-50 text-rose-700 border border-rose-200",
    LATE: "bg-amber-50 text-amber-700 border border-amber-200",
    EXCUSED: "bg-sky-50 text-sky-700 border border-sky-200",
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PARTIAL: "bg-amber-50 text-amber-700 border border-amber-200",
    PENDING: "bg-blue-50 text-blue-700 border border-blue-200",
    OVERDUE: "bg-red-50 text-red-700 border border-red-200",
    ADMIN: "bg-purple-50 text-purple-700 border border-purple-200",
    TEACHER: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    STUDENT: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    default: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const chosenStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide ${sizeStyles[size]} ${chosenStyle} ${className}`}
    >
      {children}
    </span>
  );
};
