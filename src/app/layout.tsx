import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduVanguard | Student Management System",
  description: "Next-generation academic management and student intelligence portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

