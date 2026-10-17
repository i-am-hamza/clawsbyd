import 'server-only';
import { db } from '@/lib/db/client';
import { services, serviceCategories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getServiceCategories(activeOnly = true) {
  const query = db
    .select()
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.sortOrder));

  if (activeOnly) {
    return db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.isActive, true))
      .orderBy(asc(serviceCategories.sortOrder));
  }

  return query;
}

export async function getServices(opts?: { activeOnly?: boolean }) {
  if (opts?.activeOnly) {
    return db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder));
  }
  return db.select().from(services).orderBy(asc(services.sortOrder));
}

export async function getServiceBySlug(slug: string) {
  const [svc] = await db.select().from(services).where(eq(services.slug, slug));
  return svc ?? null;
}

export async function getServicesWithCategories() {
  return db
    .select({ service: services, category: serviceCategories })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.isActive, true))
    .orderBy(asc(serviceCategories.sortOrder), asc(services.sortOrder));
}
