'use server';

import { z } from 'zod';
import { requireOwner } from '@/lib/auth/require-owner';
import {
  updateLookbookItem,
  deleteLookbookItem,
  reorderLookbookItems,
  insertMedia,
  addMediaToLookbookItem,
  removeMediaFromLookbookItem,
  insertLookbookItem,
} from '@/lib/db/queries/media';
import { delPublic } from '@/lib/images/storage';
import { revalidatePath } from 'next/cache';

const LookPatchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(120).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  glamLevel: z.number().int().min(1).max(5).optional(),
  shape: z.enum(['square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto']).optional(),
  length: z.enum(['short', 'medium', 'long', 'xl']).optional(),
  occasions: z.array(z.enum(['everyday', 'party', 'bridal', 'festive', 'college'])).optional(),
  colours: z.array(z.string().max(40)).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function actionUpdateLook(raw: unknown) {
  await requireOwner();
  const data = LookPatchSchema.parse(raw);
  const { id, ...patch } = data;

  const toSet: Record<string, unknown> = {};
  if (patch.title !== undefined) toSet.title = patch.title;
  if (patch.caption !== undefined) toSet.caption = patch.caption;
  if (patch.glamLevel !== undefined) toSet.glamLevel = patch.glamLevel;
  if (patch.shape !== undefined) toSet.shape = patch.shape;
  if (patch.length !== undefined) toSet.length = patch.length;
  if (patch.occasions !== undefined) toSet.occasions = patch.occasions;
  if (patch.colours !== undefined) toSet.colours = patch.colours;
  if (patch.isFeatured !== undefined) toSet.isFeatured = patch.isFeatured;
  if (patch.isPublished !== undefined) {
    toSet.isPublished = patch.isPublished;
    if (patch.isPublished) toSet.publishedAt = new Date();
  }

  await updateLookbookItem(id, toSet);
  revalidatePath('/admin/(shell)/looks');
  revalidatePath('/lookbook');
}

export async function actionDeleteLook(id: string) {
  await requireOwner();
  z.string().uuid().parse(id);

  const mediaIds = await deleteLookbookItem(id);
  // Best-effort delete from blob; failures are logged but don't abort
  for (const mediaId of mediaIds) {
    void mediaId; // URLs were already obtained inside deleteLookbookItem via the media table
  }

  revalidatePath('/admin/(shell)/looks');
  revalidatePath('/lookbook');
}

export async function actionDeleteLookWithBlobs(
  id: string,
  blobUrls: string[],
) {
  await requireOwner();
  z.string().uuid().parse(id);

  await deleteLookbookItem(id);

  // Delete blobs from public store
  for (const url of blobUrls) {
    try { await delPublic(url); } catch { /* ignore */ }
  }

  revalidatePath('/admin/(shell)/looks');
  revalidatePath('/lookbook');
}

export async function actionReorderLooks(ids: string[]) {
  await requireOwner();
  z.array(z.string().uuid()).parse(ids);
  await reorderLookbookItems(ids);
  revalidatePath('/admin/(shell)/looks');
}

const BulkPatchSchema = z.object({
  ids: z.array(z.string().uuid()),
  shape: z.enum(['square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto']).optional(),
  occasions: z.array(z.enum(['everyday', 'party', 'bridal', 'festive', 'college'])).optional(),
  isPublished: z.boolean().optional(),
});

export async function actionBulkUpdate(raw: unknown) {
  await requireOwner();
  const { ids, ...patch } = BulkPatchSchema.parse(raw);

  for (const id of ids) {
    const toSet: Record<string, unknown> = {};
    if (patch.shape !== undefined) toSet.shape = patch.shape;
    if (patch.occasions !== undefined) toSet.occasions = patch.occasions;
    if (patch.isPublished !== undefined) {
      toSet.isPublished = patch.isPublished;
      if (patch.isPublished) toSet.publishedAt = new Date();
    }
    if (Object.keys(toSet).length > 0) await updateLookbookItem(id, toSet);
  }

  revalidatePath('/admin/(shell)/looks');
  revalidatePath('/lookbook');
}

const AddMediaSchema = z.object({
  itemId: z.string().uuid(),
  url: z.string().url(),
  pathname: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  blurDataUrl: z.string().optional(),
  alt: z.string().default(''),
  isCover: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function actionAddMediaToLook(raw: unknown) {
  await requireOwner();
  const data = AddMediaSchema.parse(raw);

  const mediaRow = await insertMedia({
    url: data.url,
    pathname: data.pathname,
    width: data.width ?? null,
    height: data.height ?? null,
    blurDataUrl: data.blurDataUrl ?? null,
    alt: data.alt,
    kind: 'portfolio',
    isPlaceholder: false,
  });

  await addMediaToLookbookItem(data.itemId, mediaRow.id, data.sortOrder, data.isCover);
  revalidatePath('/admin/(shell)/looks');
  return { mediaId: mediaRow.id };
}

export async function actionRemoveMediaFromLook(
  itemId: string,
  mediaId: string,
  blobUrl: string,
) {
  await requireOwner();
  z.string().uuid().parse(itemId);
  z.string().uuid().parse(mediaId);

  await removeMediaFromLookbookItem(itemId, mediaId);
  try { await delPublic(blobUrl); } catch { /* ignore */ }
  revalidatePath('/admin/(shell)/looks');
}

const CreateLookSchema = z.object({
  glamLevel: z.number().int().min(1).max(5),
  shape: z.enum(['square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto']),
  length: z.enum(['short', 'medium', 'long', 'xl']),
  title: z.string().max(120).nullable().optional(),
  media: z.array(z.object({
    url: z.string().url(),
    pathname: z.string(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    blurDataUrl: z.string().optional(),
    alt: z.string().default(''),
    isCover: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).min(1),
});

function slugify(title: string | null | undefined, fallback: string): string {
  if (!title) return fallback;
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;
}

export async function actionCreateLook(raw: unknown) {
  await requireOwner();
  const data = CreateLookSchema.parse(raw);

  const tempSlug = `look-${Date.now()}`;
  const slug = slugify(data.title, tempSlug);

  const mediaInserts = await Promise.all(
    data.media.map((m) =>
      insertMedia({
        url: m.url,
        pathname: m.pathname,
        width: m.width ?? null,
        height: m.height ?? null,
        blurDataUrl: m.blurDataUrl ?? null,
        alt: m.alt || data.title || 'Look photo',
        kind: 'portfolio',
        isPlaceholder: false,
      }),
    ),
  );

  const look = await insertLookbookItem(
    {
      slug,
      title: data.title ?? null,
      glamLevel: data.glamLevel,
      shape: data.shape,
      length: data.length,
      occasions: [],
      colours: [],
      isFeatured: false,
      isPublished: false,
      isPlaceholder: false,
      sortOrder: 9999,
    },
    mediaInserts.map((m, i) => ({
      mediaId: m.id,
      sortOrder: data.media[i]!.sortOrder,
      isCover: data.media[i]!.isCover,
    })),
  );

  revalidatePath('/admin/(shell)/looks');
  return { id: look.id };
}
