import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

/**
 * Crea el primer administrador usando variables de entorno. No usa
 * credenciales hardcodeadas. Seguro de ejecutar más de una vez: si el
 * usuario ya existe, no lo modifica.
 */
async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_FULLNAME ?? "Administrador";

  if (!username || !password) {
    console.error(
      "Faltan BOOTSTRAP_ADMIN_USERNAME y/o BOOTSTRAP_ADMIN_PASSWORD en el entorno. No se creó ningún administrador.",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`El usuario administrador "${username}" ya existe. No se realizaron cambios.`);
      return;
    }

    const passwordHash = await hashPassword(password);
    const admin = await prisma.user.create({
      data: { username, fullName, passwordHash, role: "ADMIN", active: true },
    });
    console.log(`Administrador creado: ${admin.username} (${admin.id}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
