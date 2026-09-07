export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type FeeType = "TUITION" | "EXAMINATION" | "LIBRARY" | "TRANSPORT" | "HOSTEL" | "MISCELLANEOUS";
export type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  studentId?: string;
  teacherId?: string;
  classId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}
