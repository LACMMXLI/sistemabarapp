import { Injectable } from "@nestjs/common";
import type { CreateProductInput, ProductAdmin, ProductOperational, UpdateProductInput } from "@barapp/contracts";
import { ERROR_CODES } from "@barapp/contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiException } from "../../common/errors/api-exception";
import { recordAudit } from "../../lib/audit";
import { computeStockStatus } from "../inventory/inventory.helpers";
import type { AuthenticatedUser } from "../../common/types/auth-user";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin(categoryId?: string): Promise<ProductAdmin[]> {
    const products = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { inventory: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      categoryId: p.categoryId,
      sku: p.sku,
      type: p.type,
      imageUrl: p.imageUrl,
      active: p.active,
      tracksInventory: p.tracksInventory,
      stockDeductPerSale: p.stockDeductPerSale,
      lowStockThreshold: p.lowStockThreshold,
      sortOrder: p.sortOrder,
      currentStock: p.tracksInventory ? p.inventory?.currentStock ?? 0 : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async listOperational(categoryId?: string): Promise<ProductOperational[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true, ...(categoryId ? { categoryId } : {}) },
      include: { inventory: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      categoryId: p.categoryId,
      type: p.type,
      imageUrl: p.imageUrl,
      active: p.active,
      stockStatus: computeStockStatus(p.tracksInventory, p.tracksInventory ? p.inventory?.currentStock ?? 0 : null, p.lowStockThreshold),
    }));
  }

  async create(input: CreateProductInput, actor: AuthenticatedUser): Promise<ProductAdmin> {
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw new ApiException(400, ERROR_CODES.VALIDATION_ERROR, "La categoría indicada no existe.");
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          priceCents: input.priceCents,
          categoryId: input.categoryId,
          sku: input.sku ?? null,
          type: input.type,
          imageUrl: input.imageUrl ?? null,
          tracksInventory: input.tracksInventory,
          stockDeductPerSale: input.stockDeductPerSale,
          lowStockThreshold: input.lowStockThreshold,
          sortOrder: input.sortOrder,
        },
      });

      if (input.tracksInventory) {
        await tx.inventory.create({ data: { productId: created.id, currentStock: input.initialStock } });
        await tx.inventoryMovement.create({
          data: {
            productId: created.id,
            type: "INITIAL",
            quantity: input.initialStock,
            resultingStock: input.initialStock,
            reason: "Existencia inicial al crear el producto",
            userId: actor.userId,
          },
        });
      }

      await recordAudit(tx, { action: "PRODUCT_CREATE", entityType: "Product", entityId: created.id, userId: actor.userId });
      return created;
    });

    return this.getAdminById(product.id);
  }

  async update(id: string, input: UpdateProductInput, actor: AuthenticatedUser): Promise<ProductAdmin> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, ERROR_CODES.NOT_FOUND, "Producto no encontrado.");
    }
    await this.prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        priceCents: input.priceCents,
        categoryId: input.categoryId,
        sku: input.sku,
        type: input.type,
        imageUrl: input.imageUrl,
        tracksInventory: input.tracksInventory,
        stockDeductPerSale: input.stockDeductPerSale,
        lowStockThreshold: input.lowStockThreshold,
        sortOrder: input.sortOrder,
        active: input.active,
      },
    });
    await recordAudit(this.prisma, {
      action: "PRODUCT_UPDATE",
      entityType: "Product",
      entityId: id,
      userId: actor.userId,
      metadata: { changedFields: Object.keys(input) },
    });
    return this.getAdminById(id);
  }

  private async getAdminById(id: string): Promise<ProductAdmin> {
    const p = await this.prisma.product.findUniqueOrThrow({ where: { id }, include: { inventory: true } });
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      categoryId: p.categoryId,
      sku: p.sku,
      type: p.type,
      imageUrl: p.imageUrl,
      active: p.active,
      tracksInventory: p.tracksInventory,
      stockDeductPerSale: p.stockDeductPerSale,
      lowStockThreshold: p.lowStockThreshold,
      sortOrder: p.sortOrder,
      currentStock: p.tracksInventory ? p.inventory?.currentStock ?? 0 : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
