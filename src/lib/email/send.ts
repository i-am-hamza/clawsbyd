import 'server-only';

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function extractLinks(html: string): string[] {
  const re = /href="(https?:\/\/[^"]+)"/g;
  const links: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    links.push(m[1]!);
  }
  return links;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not set — cannot send email in production');
    }
    const links = extractLinks(payload.html);
    const linksStr = links.length ? `  links: ${links.join(' | ')}` : '';
    console.log(`[EMAIL DEV] to=${payload.to} subject="${payload.subject}"${linksStr ? '\n' + linksStr : ''}`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? 'Claws by D <bookings@clawsbyd.in>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}
