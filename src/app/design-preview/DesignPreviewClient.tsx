'use client';

import { useState } from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { Monogram } from '@/components/brand/Monogram';
import { MoodProvider, MoodSlider, useMood } from '@/components/ui/MoodProvider';
import { NailPreview } from '@/components/ui/NailPreview';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { PriceTag } from '@/components/ui/PriceTag';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stepper } from '@/components/ui/Stepper';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { Sheet } from '@/components/ui/Sheet';
import { Toast } from '@/components/ui/Toast';
import { Accordion } from '@/components/ui/Accordion';
import type { NailShape, NailLength } from '@/lib/nail-svg';

const SWATCH_PRESETS: Array<{ label: string; shape: NailShape; length: NailLength; colours: string[]; mood: number }> = [
  { label: 'Sheer Glazed', shape: 'oval',    length: 'short',  colours: ['#F5E8EC', '#FAEEF2'], mood: 0.0 },
  { label: 'Milk French',  shape: 'squoval', length: 'short',  colours: ['#F9F5F0', '#FAE8D5'], mood: 0.2 },
  { label: 'Blush Ombre',  shape: 'almond',  length: 'medium', colours: ['#F4B6C6', '#C46E8B'], mood: 0.4 },
  { label: 'Berry Bold',   shape: 'almond',  length: 'long',   colours: ['#A3405A', '#7B2040'], mood: 0.6 },
  { label: 'Dark Chrome',  shape: 'coffin',  length: 'long',   colours: [], mood: 0.8 },
  { label: 'Full Glam',    shape: 'stiletto', length: 'xl',    colours: ['#851230'], mood: 1.0 },
];

function NailSwatchCard({ shape, length, colours, label, moodVal, finish }: {
  shape: NailShape; length: NailLength; colours: string[]; label: string; moodVal: number;
  finish?: 'solid' | 'chrome' | 'cat-eye';
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)]"
      style={{ '--mood': String(moodVal) } as React.CSSProperties}
    >
      <NailPreview shape={shape} length={length} colours={colours} finish={finish ?? (colours.length === 0 ? 'chrome' : 'solid')} gap={3} />
      <span className="text-xs text-[var(--text-muted)] text-center">{label}</span>
    </div>
  );
}

function LookbookCard() {
  return (
    <Card className="overflow-hidden w-full max-w-[200px]">
      <div className="aspect-[4/5] bg-[var(--blush,#F0C0CB)] relative flex items-center justify-center">
        <NailPreview shape="almond" length="medium" colours={['#A3405A', '#C4789A']} gap={3} />
        <div className="absolute top-2 right-2">
          <Badge variant="muted">Almond · Long</Badge>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-sm font-medium text-[var(--text)]">Berry Almond</span>
        <div className="flex gap-1 flex-wrap">
          <Badge>Everyday</Badge>
          <Badge variant="accent">Glam 4</Badge>
        </div>
      </div>
    </Card>
  );
}

function ServiceRow() {
  const [qty, setQty] = useState(5);
  return (
    <div className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex-1">
        <p className="font-medium text-[var(--text)]">Detailed hand-painted art</p>
        <p className="text-sm text-[var(--text-muted)]">Per nail · 10 min</p>
      </div>
      <Stepper value={qty} onChange={setQty} min={1} max={20} label="Nails" />
      <PriceTag paise={qty * 10000} />
    </div>
  );
}

function LaunchBanner() {
  return (
    <div className="w-full px-4 py-3 text-center text-sm font-medium bg-[var(--accent)] text-[var(--btn-primary-text)] rounded-[var(--radius-chip)]">
      ₹200 off extension sets for my first 25 clients — <strong>18 spots left</strong>
    </div>
  );
}

function AdminTabBar() {
  const tabs = ['Home', 'Bookings', 'Orders', 'Looks', 'More'];
  const [active, setActive] = useState('Home');
  return (
    <nav aria-label="Admin tabs" className="w-full border-t border-[var(--border)] bg-[var(--ground)] flex">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`flex-1 flex flex-col items-center justify-center py-3 text-xs min-h-[var(--tap-target)] gap-0.5 transition-colors ${t === active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          aria-current={t === active ? 'page' : undefined}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            {t === 'Home' ? '⌂' : t === 'Bookings' ? '📅' : t === 'Orders' ? '📦' : t === 'Looks' ? '✦' : '⋯'}
          </span>
          {t}
        </button>
      ))}
    </nav>
  );
}

function WelcomeNoteDemo() {
  return (
    <div className="w-full min-h-[320px] flex flex-col items-center justify-center gap-8 p-8 rounded-[var(--radius-card)] bg-[var(--ground)] border border-[var(--border)]">
      <p
        className="max-w-sm text-center leading-relaxed text-[var(--text)] whitespace-pre-line"
        style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}
      >
        {`Lorem ipsum, CEO saahiba.\n\nYe pura website demo hai.\nAap yahan design dekh sakti hain.`}
      </p>
      <Button size="lg">Chaliye shuru karein</Button>
    </div>
  );
}

function DirectionShowcase() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [chipSelected, setChipSelected] = useState<Set<string>>(new Set(['Almond']));
  const { mood } = useMood();

  const toggleChip = (v: string) =>
    setChipSelected(prev => {
      const next = new Set(prev);
      if (next.has(v)) { next.delete(v); } else { next.add(v); }
      return next;
    });

  return (
    <div className="flex flex-col gap-8">

      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <Monogram size={28} />
        <Wordmark size="md" italic />
        <button className="text-[var(--text-muted)] min-w-[var(--tap-target)] min-h-[var(--tap-target)] flex items-center justify-center" aria-label="Menu">
          ≡
        </button>
      </header>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Mood strip — drag to shift</h2>
        <MoodSlider />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
          {SWATCH_PRESETS.map(s => (
            <NailSwatchCard key={s.label} {...s} moodVal={s.mood} />
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Current mood: <strong>{(mood * 100).toFixed(0)}%</strong> —
          accent shifts continuously via CSS color-mix(in oklch)
        </p>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Lookbook card</h2>
        <div className="flex gap-4 flex-wrap">
          <LookbookCard />
          <div className="flex flex-col gap-2">
            <Skeleton height={200} className="w-[120px]" />
            <Skeleton height={16} className="w-[80px]" />
          </div>
        </div>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Service row with stepper</h2>
        <ServiceRow />
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Book a set</Button>
          <Button variant="secondary">Shop press-ons</Button>
          <Button variant="ghost">Learn more</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Form field with error</h2>
        <div className="max-w-sm flex flex-col gap-4">
          <Input
            label="WhatsApp number"
            placeholder="9XXXXXXXXX"
            error="Please enter a valid Indian mobile number."
          />
          <Input
            label="Name"
            placeholder="Your name"
            hint="As you'd like to be addressed."
          />
        </div>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Chips</h2>
        <ChipGroup label="Nail shape">
          {['Square', 'Almond', 'Coffin', 'Stiletto', 'Oval'].map(s => (
            <Chip
              key={s}
              selected={chipSelected.has(s)}
              onClick={() => toggleChip(s)}
              onRemove={() => toggleChip(s)}
            >
              {s}
            </Chip>
          ))}
        </ChipGroup>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Progress steps</h2>
        <ProgressSteps
          steps={['Services', 'Date', 'Location', 'Inspiration', 'Details']}
          current={2}
        />
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Launch-offer banner</h2>
        <LaunchBanner />
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default">Requested</Badge>
          <Badge variant="accent">Confirmed</Badge>
          <Badge variant="muted">Completed</Badge>
          <Badge variant="success">Paid</Badge>
          <Badge variant="warning">Awaiting deposit</Badge>
          <Badge variant="error">Declined</Badge>
        </div>
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Bottom sheet / dialog</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
          <Button variant="secondary" onClick={() => setToastVisible(true)}>Show toast</Button>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Send on WhatsApp">
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Your booking request has been saved. Tap below to let me know on WhatsApp.
          </p>
          <Button variant="primary" className="w-full">Open WhatsApp</Button>
        </Sheet>
        {toastVisible && (
          <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50">
            <Toast message="Booking request saved." variant="success" onDismiss={() => setToastVisible(false)} />
          </div>
        )}
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Accordion (FAQ)</h2>
        <Accordion items={[
          { id: 'q1', question: 'Do I need to pay a deposit?', answer: '₹200 for any extension set or home visit, ₹500 for bridal, paid after confirmation.' },
          { id: 'q2', question: 'How long do sets last?', answer: 'Gel polish typically lasts 2–3 weeks. Extensions are usually refilled every 3–4 weeks.' },
        ]} />
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Welcome note screen styling (lorem text)</h2>
        <WelcomeNoteDemo />
      </section>

      <section className="px-4">
        <h2 className="font-medium text-[var(--text-muted)] text-sm mb-3">Admin bottom tab bar</h2>
        <div className="border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden">
          <AdminTabBar />
        </div>
      </section>

    </div>
  );
}

export default function DesignPreviewClient() {
  return (
    <div
      data-direction="a"
      style={{ minHeight: '100dvh', background: 'var(--ground)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
    >
      <div
        className="sticky top-0 z-50 flex items-center justify-between gap-2 px-4 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--ground)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Design preview</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Direction A — Lookbook</span>
      </div>

      <div className="px-4 pt-6 pb-2">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Direction A — Lookbook</strong> ·
          Bodoni Moda display · Instrument Sans body · Light ground · Editorial left-aligned
        </p>
      </div>

      <MoodProvider>
        <DirectionShowcase />
      </MoodProvider>

      <div style={{ height: 80 }} />
    </div>
  );
}
