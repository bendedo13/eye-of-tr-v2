import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { search_logs: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const stats = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      credits: {
        amount: user.credits,
        tier: user.tier,
      },
      search_stats: {
        total_searches: user.search_logs.length,
        success_rate: user.search_logs.length > 0 ? 85 : 0,
        recent_searches: user.search_logs.slice(-5).map(s => ({
          type: s.search_type || "Facial",
          date: s.created_at,
          results: s.results_found || 0,
          successful: s.is_successful,
          was_blurred: s.was_blurred
        })),
      },
      referral: {
        referral_code: user.referral_code,
        total_referrals: user.referral_count,
        total_credits_earned: 0,
        next_credit_in: 3,
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Route Error:", error);
    return NextResponse.json(
      { error: "Hata oluştu", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}