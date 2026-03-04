import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { email: true, role: true, name: true },
  });
  console.log("Users:", users);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
