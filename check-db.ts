import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const institution = await prisma.institution.findFirst({
    where: { slug: "scholaops-demo" }
  });
  console.log("Institution:", institution?.name);
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log("Users:", users.map(u => u.email));
}
main().finally(() => prisma.$disconnect());
