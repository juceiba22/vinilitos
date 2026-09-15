/**
 * Genera códigos de renovación (+1 año de suscripción) para entregar cuando
 * un músico paga la renovación presencialmente.
 * Uso: node scripts/generate-renewal-codes.js "Renovaciones feria marzo 2027" 10
 */
const { PrismaClient } = require("@prisma/client");
const { randomCode } = require("./code-format");

const prisma = new PrismaClient();

async function main() {
  const batchName = process.argv[2] ?? "Tirada sin nombre";
  const quantity = parseInt(process.argv[3] ?? "10", 10);

  const codes = [];
  for (let i = 0; i < quantity; i++) {
    codes.push({ code: `RNVL-${randomCode()}`, batchName });
  }

  await prisma.renewalCode.createMany({ data: codes });

  console.log(`Generados ${quantity} códigos de renovación para "${batchName}":\n`);
  codes.forEach((c) => console.log(c.code));
  console.log(
    `\nCada código se canjea desde el editor de la página del músico ("Renovar +1 año").`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
