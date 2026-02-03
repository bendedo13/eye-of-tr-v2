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
    const plans = await prisma.pricingPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: "Fiyatlar yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const data = await request.json();
    const plan = await prisma.pricingPlan.create({ data });
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json({ error: "Plan oluşturma hatası" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const { id, ...data } = await request.json();
    const plan = await prisma.pricingPlan.update({ where: { id }, data });
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json({ error: "Plan güncelleme hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdminKey(request);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    await prisma.pricingPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Plan silme hatası" }, { status: 500 });
  }
}
