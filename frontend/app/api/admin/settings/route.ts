import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function requireAdminKey(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = request.headers.get("x-admin-key");
  if (!adminKey || !provided || provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const settings = await prisma.siteSettings.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    return NextResponse.json(settingsMap);
  } catch (error) {
    return NextResponse.json({ error: "Ayarlar yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const { key, value } = await request.json();
    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    return NextResponse.json({ success: true, setting });
  } catch (error) {
    return NextResponse.json({ error: "Ayar kaydetme hatası" }, { status: 500 });
  }
}
