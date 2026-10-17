import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const IST = 'Asia/Kolkata';

function toIST(date: Date): TZDate {
  return new TZDate(date, IST);
}

/** "Sat, 14 Nov" */
export function formatDate(date: Date): string {
  return format(toIST(date), 'EEE, d MMM');
}

/** "4:30 PM" */
export function formatTime(date: Date): string {
  return format(toIST(date), 'h:mm aa');
}

/** "Sat, 14 Nov at 4:30 PM" */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/** For lead time: "5–7 days" */
export function formatLeadTime(min: number, max: number): string {
  return min === max ? `${min} days` : `${min}–${max} days`;
}
