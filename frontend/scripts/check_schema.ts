import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('Search', 'users')
    ORDER BY table_name, column_name;
  `;
    const report = (result as any[]).map(c => `${c.table_name}.${c.column_name}:${c.data_type}`).join(" | ");
    console.log(report);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
