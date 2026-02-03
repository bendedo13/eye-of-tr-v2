import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gerekli" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, user.hashed_password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Şifre hatalı" },
        { status: 401 }
      );
    }

    // JWT token oluştur (Backend ile uyumlu)
    const token = jwt.sign(
      { sub: String(user.id) },
      process.env.NEXTAUTH_SECRET || "eye-of-tr-v2-super-secret-key-2026",
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "Giriş başarılı",
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Giriş sırasında hata oluştu" },
      { status: 500 }
    );
  }
}