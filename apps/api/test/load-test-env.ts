import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Si existe apps/api/.env.test, sus variables tienen prioridad sobre .env
 * para las pruebas e2e (evita que corran contra la base operativa por
 * accidente). Si no existe, se usa .env normalmente (ya cargado por Nest).
 */
const testEnvPath = resolve(__dirname, "../.env.test");
if (existsSync(testEnvPath)) {
  const content = readFileSync(testEnvPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
  // eslint-disable-next-line no-console
  console.log("[e2e] Usando variables de entorno de .env.test");
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[e2e] No se encontró apps/api/.env.test — las pruebas e2e usarán DATABASE_URL de .env. " +
      "Crea .env.test con una base de datos dedicada para no escribir datos de prueba en la base operativa.",
  );
}
