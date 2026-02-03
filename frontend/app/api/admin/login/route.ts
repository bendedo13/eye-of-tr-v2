import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
    }

    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin && email === "bendedo13@gmail.com") {
      const hashedPassword = await bcrypt.hash("Benalan.1", 10);
      admin = await prisma.admin.create({
        data: { email: "bendedo13@gmail.com", password: hashedPassword, name: "Admin" }
      });
    }

    if (!admin) {
      return NextResponse.json({ error: "Admin bulunamadı" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Giriş hatası" }, { status: 500 });
  }
}