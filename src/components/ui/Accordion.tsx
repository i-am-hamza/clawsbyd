'use client';

import { useState } from 'react';

interface AccordionItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <dl className="divide-y divide-[var(--border)]">
      {items.map(item => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id}>
            <dt>
              <button
                aria-expanded={isOpen}
                aria-controls={`acc-${item.id}`}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between py-4 text-left text-[var(--text)] font-medium min-h-[var(--tap-target)] gap-4"
              >
                <span>{item.question}</span>
                <span aria-hidden="true" className={`shrink-0 transition-transform duration-[var(--duration-ui)] ${isOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
            </dt>
            <dd
              id={`acc-${item.id}`}
              hidden={!isOpen}
              className="pb-4 text-[var(--text-muted)] text-sm leading-relaxed"
            >
              {item.answer}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
