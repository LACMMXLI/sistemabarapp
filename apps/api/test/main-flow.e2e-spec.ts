import "reflect-metadata";
import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";
import { PrismaService } from "../src/prisma/prisma.service";
import { hashPassword } from "../src/lib/password";

/**
 * Prueba de integración de extremo a extremo contra una base de datos real
 * (usa DATABASE_URL de apps/api/.env). Recomendado: apuntar a una base de
 * datos de pruebas dedicada, nunca a producción — este flujo crea filas
 * financieras reales y, por diseño del sistema, no se eliminan físicamente.
 *
 * Flujo: login administrador → crear categoría/producto/mesa → abrir mesa
 * → agregar producto → verificar descuento de inventario → abrir caja
 * → cobrar → verificar mesa libre → verificar el corte de caja.
 */
describe("Flujo principal end-to-end", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = randomUUID().slice(0, 8);
  const username = `e2e_admin_${suffix}`;
  const password = "Test1234!";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix("api");
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { username, fullName: "E2E Admin", passwordHash, role: "ADMIN" },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("login → caja → mesa → producto → cobro → inventario → corte", async () => {
    const server = app.getHttpServer();
    const withAuth = (token: string) => (req: request.Test) => req.set("Authorization", `Bearer ${token}`);

    const login = await request(server).post("/api/auth/login").send({ username, password }).expect(200);
    const token = login.body.accessToken as string;
    const auth = withAuth(token);

    const category = await auth(request(server).post("/api/categories")).send({ name: `E2E Cat ${suffix}`, sortOrder: 1 }).expect(201);

    const product = await auth(request(server).post("/api/products"))
      .send({
        name: `E2E Prod ${suffix}`,
        priceCents: 5000,
        categoryId: category.body.id,
        type: "STANDARD",
        tracksInventory: true,
        stockDeductPerSale: 1,
        lowStockThreshold: 2,
        initialStock: 5,
        sortOrder: 1,
      })
      .expect(201);
    expect(product.body.currentStock).toBe(5);

    await auth(request(server).post("/api/tables")).send({ name: `E2E Mesa ${suffix}`, type: "STANDARD" }).expect(201);
    const tablesBefore = await auth(request(server).get("/api/tables")).expect(200);
    const table = tablesBefore.body.find((t: { name: string }) => t.name === `E2E Mesa ${suffix}`);
    expect(table.status).toBe("AVAILABLE");

    const openA = await auth(request(server).post(`/api/tables/${table.id}/open`)).expect(201);
    const openB = await auth(request(server).post(`/api/tables/${table.id}/open`)).expect(201);
    expect(openA.body.orderId).toBe(openB.body.orderId); // no crea dos órdenes para la misma mesa
    const orderId = openA.body.orderId;

    const withItem = await auth(request(server).post(`/api/orders/${orderId}/items`))
      .send({ productId: product.body.id, quantity: 2, idempotencyKey: `e2e-item-${suffix}` })
      .expect(201);
    expect(withItem.body.totalCents).toBe(10000);

    const inventoryAfterSale = await auth(request(server).get("/api/inventory")).expect(200);
    const inventoryRow = inventoryAfterSale.body.find((i: { productId: string }) => i.productId === product.body.id);
    expect(inventoryRow.currentStock).toBe(3); // 5 - 2

    const register = await auth(request(server).post("/api/cash/registers")).send({ name: `E2E Caja ${suffix}` }).expect(201);
    const shift = await auth(request(server).post("/api/cash/shifts"))
      .send({ registerId: register.body.id, openingFloatCents: 10000, idempotencyKey: `e2e-shift-${suffix}` })
      .expect(201);

    const firstPay = await auth(request(server).post(`/api/orders/${orderId}/pay`))
      .send({ idempotencyKey: `e2e-pay-${suffix}`, payments: [{ method: "CASH", amountCents: 10000, receivedCents: 10000 }] })
      .expect(201);
    expect(firstPay.body.order.status).toBe("PAID");
    expect(firstPay.body.changeCents).toBe(0);

    // Reintento con la misma idempotency key: no debe generar un segundo pago.
    const secondPay = await auth(request(server).post(`/api/orders/${orderId}/pay`))
      .send({ idempotencyKey: `e2e-pay-${suffix}`, payments: [{ method: "CASH", amountCents: 10000, receivedCents: 10000 }] })
      .expect(201);
    expect(secondPay.body.order.status).toBe("PAID");

    const tablesAfterPay = await auth(request(server).get("/api/tables")).expect(200);
    const tableAfterPay = tablesAfterPay.body.find((t: { id: string }) => t.id === table.id);
    expect(tableAfterPay.status).toBe("AVAILABLE");

    const closed = await auth(request(server).post(`/api/cash/shifts/${shift.body.id}/close`))
      .send({ countedCashCents: 20000, idempotencyKey: `e2e-close-${suffix}` })
      .expect(201);
    expect(closed.body.cashSalesCents).toBe(10000);
    expect(closed.body.expectedCashCents).toBe(20000); // 10000 fondo + 10000 en efectivo
    expect(closed.body.differenceCents).toBe(0);
  });

  it("un usuario sin permiso recibe 403", async () => {
    const server = app.getHttpServer();
    const meseroUsername = `e2e_mesero_${suffix}`;
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { username: meseroUsername, fullName: "E2E Mesero", passwordHash, role: "MESERO" },
    });

    const login = await request(server).post("/api/auth/login").send({ username: meseroUsername, password }).expect(200);
    await request(server)
      .get("/api/products/admin")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .expect(403);
  });
});
