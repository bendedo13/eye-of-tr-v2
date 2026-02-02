import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, bannedUsers, totalSearches, todaySearches, todaySignups, totalCredits] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "banned" } }),
      prisma.search.count(),
      prisma.search.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.aggregate({ _sum: { credits: true } })
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, credits: true, status: true, createdAt: true }
    });

    const recentSearches = await prisma.search.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } }
    });

    return NextResponse.json({
      stats: { totalUsers, activeUsers, bannedUsers, totalSearches, todaySearches, todaySignups, totalCredits: totalCredits._sum.credits || 0 },
      recentUsers,
      recentSearches
    });
  } catch (error) {
    return NextResponse.json({ error: "İstatistik hatası" }, { status: 500 });
  }
}