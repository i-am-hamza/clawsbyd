import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { REGISTRY, PUBLIC_KEYS, getDefault, type SettingKey } from './registry';

type AllSettings = {
  [K in SettingKey]: (typeof REGISTRY)[K]['default'];
};

async function loadAllSettings(): Promise<AllSettings> {
  const rows = await db.select().from(settings);
  const result = {} as AllSettings;

  for (const key of Object.keys(REGISTRY) as SettingKey[]) {
    const row = rows.find((r) => r.key === key);
    if (row !== undefined) {
      try {
        result[key] = REGISTRY[key]!.schema.parse(row.value) as AllSettings[typeof key];
      } catch {
        result[key] = getDefault(key);
      }
    } else {
      result[key] = getDefault(key);
    }
  }

  return result;
}

export const getSettings = unstable_cache(loadAllSettings, ['settings-all'], {
  tags: ['settings'],
});

type PublicSettings = {
  [K in SettingKey as (typeof REGISTRY)[K]['public'] extends true ? K : never]: (typeof REGISTRY)[K]['default'];
};

export const getPublicSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    const all = await loadAllSettings();
    const pub = {} as PublicSettings;

    for (const key of Object.keys(all) as SettingKey[]) {
      if (PUBLIC_KEYS.has(key)) {
        // Type-cast is safe: we only include keys where public === true
        (pub as Record<string, unknown>)[key] = all[key];
      }
    }

    return pub;
  },
  ['settings-public'],
  { tags: ['settings'] },
);
