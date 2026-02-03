import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId: token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    // JWT doğrula
    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "eye-of-tr-v2-super-secret-key-2026");
    } catch (e) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });
    }

    const userId = decoded.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, credits: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}