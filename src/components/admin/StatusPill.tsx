import { getSettings } from '@/lib/settings/read';

export default async function StatusPill() {
  const s = await getSettings();
  const live = s['site.go_live'];
  return (
    <span
      className="status-pill"
      data-live={live ? 'true' : 'false'}
      aria-label={live ? 'Site is live' : 'Site is in preview'}
    >
      {live ? 'Live' : 'Preview'}
    </span>
  );
}
