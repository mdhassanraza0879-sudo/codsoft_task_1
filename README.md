# 🎓 Full-Stack Student Management System (CodSoft Task 1)

A modern, full-stack Student Management System built with **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**. It provides a comprehensive multi-role platform for Administrators, Teachers, and Students.

---

## 🌟 Key Features

### 🔐 Multi-Role Authentication & Authorization
- Secure JWT-based authentication using HTTP-only cookies and bcrypt password hashing.
- Role-Based Access Control (RBAC) with Next.js Middleware guarding routes:
  - **Admin Dashboard**: Full administrative control across the entire school ecosystem.
  - **Teacher Dashboard**: Class, attendance, and exam marks management.
  - **Student Dashboard**: Timetable, attendance stats, report cards, and fee status.

### 👨‍💼 Administrator Capabilities
- **Dashboard & Analytics**: Real-time stats on students, teachers, classes, and revenue.
- **Student Management**: Add, update, view, and manage student enrollments.
- **Teacher Management**: Manage staff profiles, qualifications, and class assignments.
- **Class & Subject Management**: Manage classes, sections, and assigned subject curricula.
- **Fee Management**: Track tuition, library, exam, and transport fees with payment statuses.
- **Audit Logs**: System-wide activity logs for critical operations.

### 👩‍🏫 Teacher Capabilities
- **Class Rosters**: Access assigned classes and enrolled student profiles.
- **Attendance Tracking**: Mark daily/subject attendance (Present, Absent, Late, Excused).
- **Exam & Marks Entry**: Record and update student marks and automated grades.

### 🧑‍🎓 Student Capabilities
- **Academic Profile**: View personal information, admission details, and enrolled classes.
- **Attendance Insights**: Check real-time attendance percentage and history.
- **Grades & Results**: View detailed exam report cards and GPA/grades.
- **Fee Records**: View due dates, payment history, and pending balances.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Server Actions / API Routes)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: Custom JWT (`jose`) with bcrypt password hashing

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/mdhassanraza0879-sudo/codsoft_task_1.git
cd codsoft_task_1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `.env` file with your PostgreSQL connection URL and JWT secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/student_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Setup Database
Run Prisma migrations to create the database schema:
```bash
npm run prisma:generate
npm run prisma:push
```

Seed the database with sample admin, teachers, students, and courses:
```bash
npm run prisma:seed
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database models and relations
│   └── seed.ts             # Initial demo database seeding
├── src/
│   ├── app/
│   │   ├── admin/          # Admin portal routes & pages
│   │   ├── api/            # REST API endpoints
│   │   ├── login/          # Auth login page
│   │   ├── student/        # Student portal routes & pages
│   │   ├── teacher/        # Teacher portal routes & pages
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing / redirect page
│   ├── components/         # Shared UI & layout components
│   ├── lib/                # Auth, db prisma client, and utilities
│   ├── middleware.ts       # Edge route protection & RBAC
│   └── types/              # TypeScript definitions
├── .env.example
├── package.json
└── tailwind.config.ts
```

---

## 📄 License
This project was developed for the CodSoft Internship program.
