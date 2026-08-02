import type { AddOrderItemInput, OrderDto, PayOrderInput } from "@barapp/contracts";
import { apiFetch, newIdempotencyKey } from "./api";

export function fetchOrder(orderId: string): Promise<OrderDto> {
  return apiFetch<OrderDto>(`/orders/${orderId}`);
}

export function addOrderItem(orderId: string, productId: string, quantity = 1): Promise<OrderDto> {
  const body: AddOrderItemInput = { productId, quantity, idempotencyKey: newIdempotencyKey("item") };
  return apiFetch<OrderDto>(`/orders/${orderId}/items`, { method: "POST", body: JSON.stringify(body) });
}

export function updateOrderItemQuantity(orderId: string, itemId: string, quantity: number): Promise<OrderDto> {
  return apiFetch<OrderDto>(`/orders/${orderId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
}

export function cancelOrderItem(orderId: string, itemId: string, reason: string): Promise<OrderDto> {
  return apiFetch<OrderDto>(`/orders/${orderId}/items/${itemId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function payOrder(orderId: string, payments: PayOrderInput["payments"]) {
  const body: PayOrderInput = { payments, idempotencyKey: newIdempotencyKey("pay") };
  return apiFetch<{ order: OrderDto; changeCents: number }>(`/orders/${orderId}/pay`, { method: "POST", body: JSON.stringify(body) });
}

export function cancelOrder(orderId: string, reason: string): Promise<OrderDto> {
  return apiFetch<OrderDto>(`/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
}
