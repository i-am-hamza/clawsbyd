import 'server-only';
import { db } from '@/lib/db/client';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, and, inArray, lte, desc } from 'drizzle-orm';
import type { OrderStatus } from '@/lib/domain/status';

export async function getOrderByRef(ref: string) {
  const [order] = await db.select().from(orders).where(eq(orders.ref, ref));
  return order ?? null;
}

export async function getOrderById(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return order ?? null;
}

export async function getOrderItems(orderId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrdersByStatus(statuses: OrderStatus[]) {
  return db
    .select()
    .from(orders)
    .where(inArray(orders.status, statuses))
    .orderBy(desc(orders.createdAt));
}

/** Returns unpaid orders that have passed their expiry time (for the daily cron). */
export async function getExpiredUnpaidOrders(before: Date) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.status, 'new'), lte(orders.expiresAt, before)));
}
