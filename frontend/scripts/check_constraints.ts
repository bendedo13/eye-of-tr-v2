import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRaw`
    SELECT
        conname AS constraint_name,
        confrelid::regclass AS table_name,
        a.attname AS column_name,
        confupdtype AS on_update,
        confdeltype AS on_delete
    FROM
        pg_constraint AS c
        JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE
        conrelid = '"Search"'::regclass;
  `;
    console.log("CONSTRAINTS:", JSON.stringify(result, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
