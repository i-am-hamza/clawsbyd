import { Suspense } from 'react';
import Link from 'next/link';
import TabBar from './TabBar';
import Sidebar from './Sidebar';
import StatusPill from './StatusPill';
import './admin-shell.css';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-header">
        <span className="admin-wordmark">Claws by D</span>
        <Suspense fallback={<span className="status-pill" data-live="false">…</span>}>
          <StatusPill />
        </Suspense>
      </header>

      {/* Desktop sidebar + main content */}
      <div className="admin-body">
        <div className="admin-sidebar-wrapper">
          <Sidebar />
        </div>
        <main className="admin-main">{children}</main>
      </div>

      {/* Footer — visible on desktop too, but primary on mobile */}
      <footer className="admin-footer">
        <Link
          href="/admin/welcome?again=1"
          className="admin-heart"
          aria-label="View welcome note"
        >
          ♡
        </Link>
      </footer>

      {/* Mobile bottom tab bar — rendered last so it sits on top */}
      <TabBar />
    </div>
  );
}
