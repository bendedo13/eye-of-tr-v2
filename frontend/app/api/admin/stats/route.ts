import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, bannedUsers, totalSearches, todaySearches, todaySignups, totalCredits] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { is_active: false } }),
      prisma.search_logs.count(),
      prisma.search_logs.count({ where: { created_at: { gte: today } } }),
      prisma.users.count({ where: { created_at: { gte: today } } }),
      prisma.users.aggregate({ _sum: { credits: true } })
    ]);

    const recentUsers = await prisma.users.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: { id: true, email: true, username: true, credits: true, is_active: true, created_at: true }
    });

    const recentSearches = await prisma.search_logs.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: { users: { select: { email: true } } }
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