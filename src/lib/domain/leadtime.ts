// §7.4 Lead time — pure function, no DB calls.

export type LeadTimeItem = {
  leadMinDays?: number | null;
  leadMaxDays?: number | null;
};

export type LeadTimeSettings = {
  pressOnLeadDays: { min: number; max: number };
  examMode: boolean;
  examLeadDays: { min: number; max: number };
};

export type LeadTimeResult = {
  min: number;
  max: number;
};

/**
 * §7.4 exam_mode → exam_lead_days; else max over items of product override or global.
 */
export function getLeadTime(
  items: LeadTimeItem[],
  settings: LeadTimeSettings,
): LeadTimeResult {
  if (settings.examMode) {
    return { min: settings.examLeadDays.min, max: settings.examLeadDays.max };
  }

  const global = settings.pressOnLeadDays;

  let min = global.min;
  let max = global.max;

  for (const item of items) {
    if (item.leadMinDays != null) min = Math.max(min, item.leadMinDays);
    if (item.leadMaxDays != null) max = Math.max(max, item.leadMaxDays);
  }

  return { min, max };
}
