import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gerekli" },
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
        password: hashedPassword,
        name: name || null,
        credits: 10,
      },
    });

    // JWT token oluştur (Backend ile uyumlu)
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { sub: user.id },
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