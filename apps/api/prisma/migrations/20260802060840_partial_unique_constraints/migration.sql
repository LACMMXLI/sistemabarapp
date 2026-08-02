-- Solo puede existir una orden OPEN por mesa.
CREATE UNIQUE INDEX "Order_tableId_open_unique"
  ON "Order" ("tableId")
  WHERE "status" = 'OPEN' AND "tableId" IS NOT NULL;

-- Solo puede existir un turno OPEN por caja.
CREATE UNIQUE INDEX "CashShift_registerId_open_unique"
  ON "CashShift" ("registerId")
  WHERE "status" = 'OPEN';

-- Solo puede existir una sesión ACTIVE o PAUSED por mesa de billar.
CREATE UNIQUE INDEX "BilliardSession_tableId_active_unique"
  ON "BilliardSession" ("tableId")
  WHERE "status" IN ('ACTIVE', 'PAUSED');

-- Duplicación de pagos por reintento: ya cubierto por Payment.idempotencyKey (UNIQUE)
-- y por OrderItem (orderId, idempotencyKey) UNIQUE declarados en el schema.
