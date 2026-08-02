/**
 * No inserta productos, mesas ni usuarios de ejemplo. El único dato que se
 * crea es el primer administrador, y solo si BOOTSTRAP_ADMIN_* está definido.
 * Ejecutar: pnpm --filter @barapp/api prisma:seed
 */
import "./../scripts/bootstrap-admin";
