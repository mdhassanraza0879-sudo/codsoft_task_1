import { PrismaClient } from "@prisma/client";

function getDatasourceUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  const hasParams = url.includes("?");
  const separator = hasParams ? "&" : "?";
  const params: string[] = [];

  if (!url.includes("connect_timeout")) {
    params.push("connect_timeout=30");
  }
  if (!url.includes("pool_timeout")) {
    params.push("pool_timeout=45");
  }
  if (!url.includes("connection_limit")) {
    params.push("connection_limit=15");
  }

  if (params.length > 0) {
    url = `${url}${separator}${params.join("&")}`;
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
