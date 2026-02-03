import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function requireAdminKey(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = request.headers.get("x-admin-key");
  if (!adminKey || !provided || provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, bannedUsers, totalSearches, todaySearches, todaySignups, totalCredits] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_active: false } }),
      prisma.searchLog.count(),
      prisma.searchLog.count({ where: { created_at: { gte: today } } }),
      prisma.user.count({ where: { created_at: { gte: today } } }),
      prisma.user.aggregate({ _sum: { credits: true } })
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      select: { id: true, email: true, username: true, credits: true, is_active: true, created_at: true }
    });

    const recentSearches = await prisma.searchLog.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
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
