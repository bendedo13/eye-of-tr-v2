import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = `newuser_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash("password123", 10);

    console.log(`Creating user: ${email}...`);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                username: "newuser",
                hashed_password: hashedPassword,
                credits: 10,
                tier: "free",
                is_active: true,
                role: "user",
                referral_code: `REF_${Date.now()}`,
                referral_count: 0,
                total_searches: 0,
                successful_searches: 0,
            }
        });

        console.log(`User created with ID: ${user.id}`);

        console.log("Creating search record...");
        const search = await prisma.search.create({
            data: {
                userId: user.id,
                imageUrl: "https://example.com/test.jpg",
                results: { matches: [], status: "pending" },
            }
        });
        console.log(`Search created with ID: ${search.id}`);

    } catch (e: any) {
        console.error("ERROR:", e.message);
        if (e.meta) console.error("META:", JSON.stringify(e.meta, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
