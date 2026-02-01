import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { searches: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const stats = {
      credits: user.credits,
      totalSearches: user.searches.length,
      successRate: user.searches.length > 0 ? 85 : 0,
      referrals: 0,
      referralCode: user.id.substring(0, 8).toUpperCase(),
      recentSearches: user.searches.slice(-5),
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}