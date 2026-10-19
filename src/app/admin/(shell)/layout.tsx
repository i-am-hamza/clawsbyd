import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/auth/require-owner';
import AdminShell from '@/components/admin/AdminShell';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const ownerRow = await requireOwner();

  // First-time welcome note redirect.
  if (ownerRow.welcomeSeenAt === null) {
    redirect('/admin/welcome');
  }

  return <AdminShell>{children}</AdminShell>;
}
