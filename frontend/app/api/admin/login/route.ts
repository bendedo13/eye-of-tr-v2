import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminEmail || !adminKey) {
      return NextResponse.json({ error: "Admin erişimi yapılandırılmamış" }, { status: 500 });
    }
    if (email !== adminEmail || password !== adminKey) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      admin: { email: adminEmail, name: "Admin" }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Giriş hatası" }, { status: 500 });
  }
}
