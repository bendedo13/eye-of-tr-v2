import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, imageUrl } = await request.json();
    console.log(`[SEARCH API] userId: ${userId}, type: ${typeof userId}`);
    const numericUserId = Number(userId);
    console.log(`[SEARCH API] numericUserId: ${numericUserId}`);

    if (!userId || !imageUrl) {
      return NextResponse.json({ error: "User ID ve resim gerekli" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: numericUserId } });
    console.log(`[SEARCH API] User found: ${!!user}`);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    if (user.credits < 1) {
      return NextResponse.json({ error: "Yetersiz kredi", needsUpgrade: true }, { status: 402 });
    }

    // Krediyi düş
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { credits: user.credits - 1 },
    });

    // Arama kaydı oluştur
    const search = await prisma.search.create({
      data: {
        userId: Number(userId),
        imageUrl,
        results: { matches: [], status: "pending" },
      },
    });

    // TODO: Burada gerçek face search API'lerini çağıracağız
    const mockResults = {
      searchId: search.id,
      matches: [
        { url: "https://example.com/1", similarity: 95, source: "web", blurred: user.credits < 3 },
        { url: "https://example.com/2", similarity: 87, source: "social", blurred: user.credits < 3 },
      ],
      creditsRemaining: user.credits - 1,
    };

    // Sonuçları güncelle
    await prisma.search.update({
      where: { id: search.id },
      data: { results: mockResults },
    });

    return NextResponse.json(mockResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Arama sırasında hata oluştu" }, { status: 500 });
  }
}