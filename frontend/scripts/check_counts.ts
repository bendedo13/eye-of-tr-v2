import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const latestUser = await prisma.user.findFirst({ orderBy: { id: "desc" } });
    const searchCount = await prisma.search.count();

    console.log(`USERS: ${userCount}`);
    if (latestUser) console.log(`LATEST USER: ID=${latestUser.id}, EMAIL=${latestUser.email}`);
    console.log(`SEARCHES: ${searchCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
