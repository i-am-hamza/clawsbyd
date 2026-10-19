// Outer admin layout: no auth here — individual sub-layouts handle that.
// Keeps login/forgot/reset outside the authenticated shell.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
