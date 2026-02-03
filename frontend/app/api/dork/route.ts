import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
const DAILY_FREE_LIMIT = 5;

const DORK_TEMPLATES: Record<string, (query: string) => string[]> = {
  general: (q) => [`"${q}"`, `intitle:"${q}"`, `inurl:"${q}"`, `"${q}" filetype:pdf`, `site:linkedin.com "${q}"`, `site:facebook.com "${q}"`],
  username: (q) => [`"${q}" site:github.com`, `"${q}" site:twitter.com`, `"${q}" site:instagram.com`, `"${q}" site:facebook.com`, `"${q}" site:linkedin.com`, `"${q}" site:tiktok.com`, `"${q}" site:reddit.com`],
  email: (q) => [`"${q}"`, `"${q}" site:linkedin.com`, `"${q}" filetype:pdf`, `intext:"${q}"`],
  phone: (q) => [`"${q}"`, `"${q}" site:facebook.com`, `intext:"${q}"`, `"${q}" filetype:pdf`],
  documents: (q) => [`"${q}" filetype:pdf`, `"${q}" filetype:doc`, `"${q}" filetype:xls`, `"${q}" filetype:ppt`],
  social: (q) => [`site:facebook.com "${q}"`, `site:twitter.com "${q}"`, `site:instagram.com "${q}"`, `site:linkedin.com "${q}"`, `site:tiktok.com "${q}"`],
};

export async function POST(request: Request) {
  try {
    const { userId, query, dorkType = "general" } = await request.json();

    if (!userId || !query) {
      return NextResponse.json({ error: "User ID ve sorgu gerekli" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dorkLimit = await prisma.dorkLimit.findUnique({ where: { userId: Number(userId) } });

    if (dorkLimit) {
      const limitDate = new Date(dorkLimit.date);
      limitDate.setHours(0, 0, 0, 0);

      if (limitDate.getTime() === today.getTime()) {
        if (dorkLimit.count >= DAILY_FREE_LIMIT && user.credits < 1) {
          return NextResponse.json({ error: "Günlük ücretsiz limitiniz doldu", needsCredits: true }, { status: 429 });
        }
      } else {
        await prisma.dorkLimit.update({ where: { userId: Number(userId) }, data: { date: today, count: 0 } });
        dorkLimit.count = 0;
      }
    } else {
      dorkLimit = await prisma.dorkLimit.create({ data: { userId: Number(userId), date: today, count: 0 } });
    }

    const isOverLimit = dorkLimit.count >= DAILY_FREE_LIMIT;
    if (isOverLimit) {
      await prisma.user.update({ where: { id: Number(userId) }, data: { credits: user.credits - 1 } });
    }

    const templateFn = DORK_TEMPLATES[dorkType] || DORK_TEMPLATES.general;
    const dorks = templateFn(query);

    const results = dorks.map((dork, index) => ({
      id: `dork-${index}`,
      query: dork,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(dork)}`,
    }));

    await prisma.dorkSearch.create({ data: { userId: Number(userId), query, dorkType, results } });
    await prisma.dorkLimit.update({ where: { userId: Number(userId) }, data: { count: dorkLimit.count + 1 } });

    return NextResponse.json({
      success: true,
      results,
      usage: { used: dorkLimit.count + 1, limit: DAILY_FREE_LIMIT, remaining: Math.max(0, DAILY_FREE_LIMIT - dorkLimit.count - 1) }
    });
  } catch (error) {
    return NextResponse.json({ error: "Arama hatası" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dorkLimit = await prisma.dorkLimit.findUnique({ where: { userId: Number(userId) } });
    let used = 0;
    if (dorkLimit) {
      const limitDate = new Date(dorkLimit.date);
      limitDate.setHours(0, 0, 0, 0);
      if (limitDate.getTime() === today.getTime()) used = dorkLimit.count;
    }

    const recentSearches = await prisma.dorkSearch.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ usage: { used, limit: DAILY_FREE_LIMIT, remaining: Math.max(0, DAILY_FREE_LIMIT - used) }, recentSearches });
  } catch (error) {
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}