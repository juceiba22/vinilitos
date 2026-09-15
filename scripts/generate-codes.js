/**
 * Genera códigos de activación para una tirada de vinilitos.
 * Uso: node scripts/generate-codes.js "Facundo Bronstein Vol.1" 20
 */
const { PrismaClient } = require("@prisma/client");
const { randomCode } = require("./code-format");

const prisma = new PrismaClient();

async function main() {
  const batchName = process.argv[2] ?? "Tirada sin nombre";
  const quantity = parseInt(process.argv[3] ?? "10", 10);

  const codes = [];
  for (let i = 0; i < quantity; i++) {
    codes.push({ code: `VNLT-${randomCode()}`, batchName });
  }

  await prisma.activationCode.createMany({ data: codes });

  console.log(`Generados ${quantity} códigos para "${batchName}":\n`);
  codes.forEach((c) => console.log(c.code));
  console.log(
    `\nCada código se activa en: http://localhost:3000/activar?code=<CODIGO>`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
