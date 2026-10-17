// §7.2 Slot engine — pure function, no DB calls.
import { TZDate } from '@date-fns/tz';
import { addMinutes, isBefore, isAfter, startOfDay, addDays } from 'date-fns';

const IST = 'Asia/Kolkata';

export type TimeWindow = { start: string; end: string }; // "HH:MM"
export type AvailabilityWindow = { weekday: number; start: string; end: string };
export type BlockedPeriod = {
  startsOn: string; // "YYYY-MM-DD"
  endsOn: string;
  startTime: string | null;
  endTime: string | null;
};
export type HoldingBooking = {
  startsAt: Date;
  endsAt: Date;
  depositDueBy: Date | null; // null = no deposit required (already confirmed)
  status: 'awaiting_deposit' | 'confirmed';
};

export type SlotContext = {
  availabilityWindows: AvailabilityWindow[];
  blockedPeriods: BlockedPeriod[];
  holdingBookings: HoldingBooking[];
  settings: {
    slotStepMin: number;
    minNoticeHours: number;
    maxAdvanceDays: number;
    bridalMinLeadDays: number;
    homeVisitWindow: TimeWindow;
    travelBufferMin: number;
  };
  isBridal?: boolean;
};

export type SlotGroup = {
  label: 'Morning' | 'Afternoon' | 'Evening';
  slots: Date[];
};

function parseHHMM(hhmm: string, baseDate: TZDate): Date {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const d = new TZDate(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0, 0, IST);
  return new Date(d);
}

function toISTDate(date: Date): TZDate {
  return new TZDate(date, IST);
}

function dateStr(date: Date): string {
  const d = toISTDate(date);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function isDateInBlockedPeriod(date: Date, period: BlockedPeriod): boolean {
  const ds = dateStr(date);
  return ds >= period.startsOn && ds <= period.endsOn;
}

/** Returns true if the interval [blockStart, blockEnd] overlaps [a, b). */
function overlaps(a: Date, b: Date, blockStart: Date, blockEnd: Date): boolean {
  return isBefore(a, blockEnd) && isBefore(blockStart, b);
}

function slotBlocked(
  start: Date,
  end: Date,
  period: BlockedPeriod,
  baseDate: Date,
): boolean {
  if (!isDateInBlockedPeriod(start, period)) return false;
  if (period.startTime === null || period.endTime === null) return true; // whole day

  const ist = toISTDate(baseDate);
  const pStart = parseHHMM(period.startTime, ist);
  const pEnd = parseHHMM(period.endTime, ist);
  return overlaps(start, end, pStart, pEnd);
}

function slotOverlapsHolding(
  start: Date,
  end: Date,
  holding: HoldingBooking,
  bufferMin: number,
  now: Date,
): boolean {
  // Expired hold: deposit_due_by passed → slot is free again
  if (
    holding.status === 'awaiting_deposit' &&
    holding.depositDueBy !== null &&
    isBefore(holding.depositDueBy, now)
  ) {
    return false;
  }

  const bufMs = bufferMin * 60_000;
  const hStart = new Date(holding.startsAt.getTime() - bufMs);
  const hEnd = new Date(holding.endsAt.getTime() + bufMs);
  return overlaps(start, end, hStart, hEnd);
}

function slotPart(start: Date): 'Morning' | 'Afternoon' | 'Evening' {
  const h = toISTDate(start).getHours();
  if (h < 12) return 'Morning';
  if (h < 16) return 'Afternoon';
  return 'Evening';
}

/**
 * §7.2 Get available slots for a date.
 * buffer = travel_buffer_min for home visits, 0 for studio.
 */
export function getSlots(
  date: Date,
  durationMin: number,
  location: 'studio' | 'home',
  ctx: SlotContext,
  now: Date = new Date(),
): SlotGroup[] {
  const ist = toISTDate(date);
  const weekday = ist.getDay(); // 0 = Sunday
  const bufferMin = location === 'home' ? ctx.settings.travelBufferMin : 0;
  const minNoticeMs = ctx.settings.minNoticeHours * 3600_000;
  const maxAdvanceMs = ctx.settings.maxAdvanceDays * 86400_000;

  // Bridal: date must be at least bridalMinLeadDays ahead (in IST days)
  if (ctx.isBridal) {
    const nowIST = toISTDate(now);
    const dateIST = toISTDate(date);
    const daysDiff = Math.floor(
      (startOfDay(dateIST).getTime() - startOfDay(nowIST).getTime()) / 86400_000,
    );
    if (daysDiff < ctx.settings.bridalMinLeadDays) return [];
  }

  // Date must not exceed max advance
  if (date.getTime() - now.getTime() > maxAdvanceMs + 86400_000) return [];

  // Windows for this weekday
  const windows = ctx.availabilityWindows.filter(
    (w) => w.weekday === weekday,
  );
  if (windows.length === 0) return [];

  const slots: Date[] = [];

  for (const win of windows) {
    const winStart = parseHHMM(win.start, ist);
    const winEnd = parseHHMM(win.end, ist);

    // Home-visit hard window: start ≥ window.start, start + duration ≤ window.end
    const homeWindowStart = parseHHMM(ctx.settings.homeVisitWindow.start, ist);
    const homeWindowEnd = parseHHMM(ctx.settings.homeVisitWindow.end, ist);

    let cursor = winStart;
    while (isBefore(cursor, winEnd)) {
      const slotStart = cursor;
      const slotEnd = addMinutes(slotStart, durationMin);
      cursor = addMinutes(cursor, ctx.settings.slotStepMin);

      // The block [start − buffer, start + duration + buffer] must fit inside window
      const blockStart = addMinutes(slotStart, -bufferMin);
      const blockEnd = addMinutes(slotEnd, bufferMin);
      if (isBefore(blockStart, winStart) || isAfter(blockEnd, winEnd)) continue;

      // Home window constraint
      if (location === 'home') {
        if (isBefore(slotStart, homeWindowStart) || isAfter(slotEnd, homeWindowEnd)) continue;
      }

      // Must be in the future beyond min_notice_hours
      if (slotStart.getTime() - now.getTime() < minNoticeMs) continue;

      // Must not exceed max_advance_days
      if (slotStart.getTime() - now.getTime() > maxAdvanceMs + 86400_000) continue;

      // Must not intersect a blocked period
      const blocked = ctx.blockedPeriods.some((p) =>
        slotBlocked(slotStart, slotEnd, p, date),
      );
      if (blocked) continue;

      // Must not overlap a holding booking (with buffers)
      const held = ctx.holdingBookings.some((h) =>
        slotOverlapsHolding(blockStart, blockEnd, h, 0, now),
      );
      if (held) continue;

      slots.push(slotStart);
    }
  }

  // Group by part of day
  const groups: SlotGroup[] = [];
  for (const label of ['Morning', 'Afternoon', 'Evening'] as const) {
    const group = slots.filter((s) => slotPart(s) === label);
    if (group.length > 0) groups.push({ label, slots: group });
  }

  return groups;
}

/**
 * Returns dates in [rangeStart, rangeEnd] (IST) that have at least one slot.
 * Useful for the date picker.
 */
export function getOpenDates(
  rangeStart: Date,
  rangeEnd: Date,
  durationMin: number,
  location: 'studio' | 'home',
  ctx: SlotContext,
  now: Date = new Date(),
): Date[] {
  const open: Date[] = [];
  let cursor = new Date(rangeStart);
  while (!isAfter(cursor, rangeEnd)) {
    const groups = getSlots(cursor, durationMin, location, ctx, now);
    if (groups.some((g) => g.slots.length > 0)) open.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return open;
}
