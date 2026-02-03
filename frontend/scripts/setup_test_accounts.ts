import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Ensure test user
    const user = await prisma.user.upsert({
        where: { email: "testuser@example.com" },
        update: { hashed_password: hashedPassword },
        create: {
            email: "testuser@example.com",
            username: "testuser",
            hashed_password: hashedPassword,
            credits: 100,
            tier: "premium",
            is_active: true,
            role: "user",
            referral_code: "TESTCODE",
            referral_count: 0,
            total_searches: 0,
            successful_searches: 0,
        }
    });

    // Ensure admin
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: { hashed_password: hashedPassword, role: "admin" },
        create: {
            email: "admin@example.com",
            username: "admin",
            hashed_password: hashedPassword,
            credits: 999,
            tier: "unlimited",
            is_active: true,
            role: "admin",
            referral_code: "ADMINCODE",
            referral_count: 0,
            total_searches: 0,
            successful_searches: 0,
        }
    });

    const adminModel = await prisma.admin.upsert({
        where: { email: "admin@example.com" },
        update: { password: hashedPassword },
        create: {
            email: "admin@example.com",
            password: hashedPassword,
            name: "System Admin"
        }
    });

    console.log("SUCCESS: Credentials set to password123");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
