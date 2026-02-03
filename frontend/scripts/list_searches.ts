import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const searches = await prisma.search.findMany({ select: { id: true, userId: true } });
    console.log("SEARCHES IN DB:");
    searches.forEach(s => console.log(`ID: ${s.id} | USER_ID: ${s.userId}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
