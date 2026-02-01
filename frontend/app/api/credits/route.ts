import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId, amount, action } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    let newCredits = user.credits;

    if (action === "add") {
      newCredits += amount || 10;
    } else if (action === "subtract") {
      newCredits = Math.max(0, newCredits - (amount || 1));
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { credits: newCredits },
    });

    return NextResponse.json({ credits: updated.credits });
  } catch (error) {
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ credits: user.credits });
}