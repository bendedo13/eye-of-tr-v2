import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: "testuser@example.com" }
    });

    if (!user) {
        console.log("USER NOT FOUND");
        return;
    }

    console.log(`FOUND USER ID: ${user.id} (${typeof user.id})`);

    try {
        const search = await prisma.search.create({
            data: {
                userId: user.id,
                imageUrl: "https://example.com/test.jpg",
                results: { matches: [], status: "pending" },
            }
        });
        console.log("SUCCESS:", search.id);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        console.error("META:", JSON.stringify(e.meta, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
