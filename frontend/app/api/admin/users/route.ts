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
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { created_at: "desc" },
                include: { _count: { select: { search_logs: true } } }
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({ users, total });
    } catch (error) {
        console.error("Admin Users GET error:", error);
        return NextResponse.json({ error: "Kullanıcılar yüklenemedi" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const auth = requireAdminKey(request);
    if (auth) return auth;
    try {
        const { userId, action, value } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
        }

        let updateData: any = {};
        if (action === "ban") updateData.is_active = false;
        if (action === "activate") updateData.is_active = true;
        if (action === "addCredits") {
            const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
            updateData.credits = (user?.credits || 0) + parseInt(value || "0");
        }
        if (action === "setCredits") updateData.credits = parseInt(value || "0");

        await prisma.user.update({
            where: { id: Number(userId) },
            data: updateData
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Users PATCH error:", error);
        return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = requireAdminKey(request);
    if (auth) return auth;
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID gerekli" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: Number(userId) } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Users DELETE error:", error);
        return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
    }
}
