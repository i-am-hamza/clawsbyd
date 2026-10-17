import 'server-only';
import { db } from '@/lib/db/client';
import { coupons, couponRedemptions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function getCouponByCode(code: string) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()));
  return coupon ?? null;
}

export async function getActiveCoupon(code: string) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, code.toUpperCase()),
        eq(coupons.isActive, true),
        gt(coupons.maxUses, coupons.usedCount),
      ),
    );
  return coupon ?? null;
}

export async function getCouponRedemptions(couponId: string) {
  return db
    .select()
    .from(couponRedemptions)
    .where(eq(couponRedemptions.couponId, couponId));
}
