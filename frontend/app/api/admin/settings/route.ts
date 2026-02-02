import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
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