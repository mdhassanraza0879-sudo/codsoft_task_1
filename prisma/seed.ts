import { PrismaClient, Role, UserStatus, AttendanceStatus, FeeType, FeeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Student Management System database seeding...");

  // Clean existing data in reverse relation order
  await prisma.activityLog.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Existing records cleaned.");

  // Password hashes
  const adminPasswordHash = await bcrypt.hash("Admin@1234", 10);
  const teacherPasswordHash = await bcrypt.hash("Teacher@1234", 10);
  const studentPasswordHash = await bcrypt.hash("Student@1234", 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@sms.edu",
      passwordHash: adminPasswordHash,
      name: "Dr. Eleanor Vance",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log("👤 Admin user created:", adminUser.email);

  // 2. Create Teacher Users and Profiles
  const teacher1User = await prisma.user.create({
    data: {
      email: "sarah.connor@sms.edu",
      passwordHash: teacherPasswordHash,
      name: "Prof. Sarah Connor",
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacher1User.id,
      employeeId: "EMP-2024-01",
      phone: "+1 (555) 234-5678",
      qualification: "M.Sc. Mathematics, B.Ed.",
      specialization: "Advanced Calculus & Statistics",
      joiningDate: new Date("2021-08-15"),
    },
  });

  const teacher2User = await prisma.user.create({
    data: {
      email: "walter.white@sms.edu",
      passwordHash: teacherPasswordHash,
      name: "Dr. Walter White",
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacher2User.id,
      employeeId: "EMP-2024-02",
      phone: "+1 (555) 345-6789",
      qualification: "Ph.D. Chemistry",
      specialization: "Organic & Physical Chemistry",
      joiningDate: new Date("2020-07-01"),
    },
  });

  const teacher3User = await prisma.user.create({
    data: {
      email: "alan.turing@sms.edu",
      passwordHash: teacherPasswordHash,
      name: "Prof. Alan Turing",
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacher3 = await prisma.teacher.create({
    data: {
      userId: teacher3User.id,
      employeeId: "EMP-2024-03",
      phone: "+1 (555) 456-7890",
      qualification: "M.S. Computer Science",
      specialization: "Algorithms, Data Structures & AI",
      joiningDate: new Date("2022-01-10"),
    },
  });

  console.log("👨‍🏫 Teachers created: 3");

  // 3. Create Classes
  const class10A = await prisma.class.create({
    data: {
      name: "Grade 10",
      section: "A",
      roomNumber: "Room 101",
      capacity: 35,
      classTeacherId: teacher1.id,
    },
  });

  const class10B = await prisma.class.create({
    data: {
      name: "Grade 10",
      section: "B",
      roomNumber: "Room 102",
      capacity: 35,
      classTeacherId: teacher2.id,
    },
  });

  const class11A = await prisma.class.create({
    data: {
      name: "Grade 11",
      section: "A",
      roomNumber: "Room 201",
      capacity: 30,
      classTeacherId: teacher3.id,
    },
  });

  console.log("🏫 Classes created: Grade 10-A, Grade 10-B, Grade 11-A");

  // 4. Create Subjects
  const math10A = await prisma.subject.create({
    data: {
      name: "Mathematics",
      code: "MATH-10A",
      description: "Algebra, Trigonometry, and Coordinate Geometry",
      classId: class10A.id,
      teacherId: teacher1.id,
    },
  });

  const chem10A = await prisma.subject.create({
    data: {
      name: "Chemistry",
      code: "CHEM-10A",
      description: "Atomic structure, Chemical Bonding, and Thermodynamics",
      classId: class10A.id,
      teacherId: teacher2.id,
    },
  });

  const eng10A = await prisma.subject.create({
    data: {
      name: "English Literature",
      code: "ENG-10A",
      description: "Classical Prose, Poetry, and Critical Essays",
      classId: class10A.id,
      teacherId: teacher1.id,
    },
  });

  const math10B = await prisma.subject.create({
    data: {
      name: "Mathematics",
      code: "MATH-10B",
      description: "Algebra, Trigonometry, and Geometry",
      classId: class10B.id,
      teacherId: teacher1.id,
    },
  });

  const cs11A = await prisma.subject.create({
    data: {
      name: "Computer Science",
      code: "CS-11A",
      description: "Data Structures, Algorithms, and Object-Oriented Programming",
      classId: class11A.id,
      teacherId: teacher3.id,
    },
  });

  console.log("📚 Subjects created: 5");

  // 5. Create Student Users and Profiles
  const studentsData = [
    {
      name: "Alex Morgan",
      email: "alex.morgan@sms.edu",
      admissionNumber: "ADM-2026-001",
      rollNumber: "10A-01",
      classId: class10A.id,
      dateOfBirth: new Date("2008-04-12"),
      gender: "Male",
      phone: "+1 (555) 111-2233",
      address: "742 Evergreen Terrace, Springfield",
      guardianName: "David Morgan",
      guardianPhone: "+1 (555) 111-9988",
      bloodGroup: "O+",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Sophia Chen",
      email: "sophia.chen@sms.edu",
      admissionNumber: "ADM-2026-002",
      rollNumber: "10A-02",
      classId: class10A.id,
      dateOfBirth: new Date("2008-09-24"),
      gender: "Female",
      phone: "+1 (555) 222-3344",
      address: "128 Beacon St, Boston, MA",
      guardianName: "Mei Chen",
      guardianPhone: "+1 (555) 222-9900",
      bloodGroup: "A+",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Marcus Vance",
      email: "marcus.vance@sms.edu",
      admissionNumber: "ADM-2026-003",
      rollNumber: "10B-01",
      classId: class10B.id,
      dateOfBirth: new Date("2008-11-18"),
      gender: "Male",
      phone: "+1 (555) 333-4455",
      address: "450 Riverdale Blvd, Chicago, IL",
      guardianName: "Robert Vance",
      guardianPhone: "+1 (555) 333-9911",
      bloodGroup: "B+",
      avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Emma Watson",
      email: "emma.watson@sms.edu",
      admissionNumber: "ADM-2026-004",
      rollNumber: "11A-01",
      classId: class11A.id,
      dateOfBirth: new Date("2007-06-30"),
      gender: "Female",
      phone: "+1 (555) 444-5566",
      address: "88 University Way, Seattle, WA",
      guardianName: "Helen Watson",
      guardianPhone: "+1 (555) 444-9922",
      bloodGroup: "AB+",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Lucas Scott",
      email: "lucas.scott@sms.edu",
      admissionNumber: "ADM-2026-005",
      rollNumber: "10A-03",
      classId: class10A.id,
      dateOfBirth: new Date("2008-01-15"),
      gender: "Male",
      phone: "+1 (555) 555-6677",
      address: "19 Oak Avenue, Austin, TX",
      guardianName: "Karen Scott",
      guardianPhone: "+1 (555) 555-9933",
      bloodGroup: "O-",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const createdStudents = [];
  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: studentPasswordHash,
        name: s.name,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        avatarUrl: s.avatarUrl,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber,
        classId: s.classId,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        phone: s.phone,
        address: s.address,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        bloodGroup: s.bloodGroup,
      },
    });

    createdStudents.push({ ...student, user });
  }

  console.log(`🎓 Students created: ${createdStudents.length}`);

  // 6. Seed Attendance records for the past 5 days
  const today = new Date();
  const dateList = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dateList.push(d);
  }

  const class10AStudents = createdStudents.filter((s) => s.classId === class10A.id);

  for (const date of dateList) {
    for (let index = 0; index < class10AStudents.length; index++) {
      const student = class10AStudents[index];
      // realistic variation: most present, occasional late or absent
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let remarks: string | null = null;
      if (index === 1 && date.getDate() % 3 === 0) {
        status = AttendanceStatus.LATE;
        remarks = "Arrived 15 mins late due to transit delay";
      } else if (index === 2 && date.getDate() % 4 === 0) {
        status = AttendanceStatus.ABSENT;
        remarks = "Medical leave";
      }

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: class10A.id,
          subjectId: math10A.id,
          date: date,
          status: status,
          remarks: remarks,
          markedById: teacher1User.id,
        },
      });
    }
  }

  console.log("📋 Attendance records seeded across 5 dates.");

  // 7. Examinations
  const exam1 = await prisma.exam.create({
    data: {
      name: "Midterm Examination",
      term: "Fall 2026",
      classId: class10A.id,
      subjectId: math10A.id,
      examDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      startTime: "09:00 AM",
      endTime: "11:30 AM",
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      name: "Unit Test 1",
      term: "Fall 2026",
      classId: class10A.id,
      subjectId: chem10A.id,
      examDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      maxMarks: 50,
      passingMarks: 20,
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      name: "Final Comprehensive Exam",
      term: "Fall 2026",
      classId: class10A.id,
      subjectId: math10A.id,
      examDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Upcoming
      startTime: "09:00 AM",
      endTime: "12:00 PM",
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  const exam4 = await prisma.exam.create({
    data: {
      name: "Semester Coding Assessment",
      term: "Fall 2026",
      classId: class11A.id,
      subjectId: cs11A.id,
      examDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Upcoming
      startTime: "01:00 PM",
      endTime: "03:30 PM",
      maxMarks: 100,
      passingMarks: 50,
    },
  });

  console.log("📝 Exams created: 4 (past and upcoming)");

  // 8. Seed Results
  const alexStudent = createdStudents[0];
  const sophiaStudent = createdStudents[1];
  const lucasStudent = createdStudents[4];

  await prisma.result.create({
    data: {
      examId: exam1.id,
      studentId: alexStudent.id,
      marksObtained: 94,
      grade: "A+",
      remarks: "Outstanding problem-solving in calculus section",
    },
  });

  await prisma.result.create({
    data: {
      examId: exam2.id,
      studentId: alexStudent.id,
      marksObtained: 46,
      grade: "A+",
      remarks: "Excellent grasp of reaction equations",
    },
  });

  await prisma.result.create({
    data: {
      examId: exam1.id,
      studentId: sophiaStudent.id,
      marksObtained: 88,
      grade: "A",
      remarks: "Very solid grasp of geometry concepts",
    },
  });

  await prisma.result.create({
    data: {
      examId: exam2.id,
      studentId: sophiaStudent.id,
      marksObtained: 42,
      grade: "A",
      remarks: "Great lab application answers",
    },
  });

  await prisma.result.create({
    data: {
      examId: exam1.id,
      studentId: lucasStudent.id,
      marksObtained: 76,
      grade: "B",
      remarks: "Good effort, review polynomial factoring",
    },
  });

  console.log("📊 Examination results entered.");

  // 9. Seed Fee Records
  for (const student of createdStudents) {
    // Tuition Term 1
    await prisma.fee.create({
      data: {
        studentId: student.id,
        title: "Tuition Fee - Fall Term 2026",
        feeType: FeeType.TUITION,
        amount: 1200,
        paidAmount: student.admissionNumber === "ADM-2026-001" ? 1200 : student.admissionNumber === "ADM-2026-002" ? 600 : 0,
        dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        status: student.admissionNumber === "ADM-2026-001" ? FeeStatus.PAID : student.admissionNumber === "ADM-2026-002" ? FeeStatus.PARTIAL : FeeStatus.PENDING,
        paidDate: student.admissionNumber === "ADM-2026-001" ? new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) : null,
        transactionRef: student.admissionNumber === "ADM-2026-001" ? `TXN-8849-${student.admissionNumber.slice(-3)}` : null,
        remarks: "Annual tuition installments approved",
      },
    });

    // Laboratory & Technology Fee
    await prisma.fee.create({
      data: {
        studentId: student.id,
        title: "STEM Laboratory & Computing Fee",
        feeType: FeeType.LIBRARY,
        amount: 250,
        paidAmount: student.admissionNumber === "ADM-2026-001" ? 250 : 0,
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: student.admissionNumber === "ADM-2026-001" ? FeeStatus.PAID : FeeStatus.PENDING,
        paidDate: student.admissionNumber === "ADM-2026-001" ? new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
        transactionRef: student.admissionNumber === "ADM-2026-001" ? `TXN-9120-${student.admissionNumber.slice(-3)}` : null,
      },
    });
  }

  console.log("💰 Fee records generated.");

  // 10. Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "SYSTEM_INITIALIZATION",
        details: "Academic year 2026 configuration completed with classes and subject courses.",
      },
      {
        userId: teacher1User.id,
        action: "ATTENDANCE_RECORDED",
        details: "Daily attendance marked for Grade 10-A (Mathematics).",
      },
      {
        userId: teacher1User.id,
        action: "RESULT_PUBLISHED",
        details: "Published Midterm Examination results for Grade 10-A Mathematics.",
      },
      {
        userId: adminUser.id,
        action: "FEE_COLLECTION",
        details: "Recorded tuition payment receipt TXN-8849-001 for Alex Morgan.",
      },
    ],
  });

  console.log("📌 System activity logs created.");
  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
