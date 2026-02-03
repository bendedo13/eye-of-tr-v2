import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gerekli" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Geçerli bir email adresi giriniz" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email zaten kayıtlı" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username: name || email.split('@')[0],
        hashed_password: hashedPassword,
        credits: 10,
        tier: "free",
        is_active: true,
        role: "user",
        referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        referral_count: 0,
        total_searches: 0,
        successful_searches: 0,
      },
    });

    // JWT token oluştur (Backend ile uyumlu)
    const token = jwt.sign(
      { sub: String(user.id) },
      process.env.NEXTAUTH_SECRET || "eye-of-tr-v2-super-secret-key-2026",
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      { message: "Kayıt başarılı", userId: user.id, access_token: token },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu" },
      { status: 500 }
    );
  }
}