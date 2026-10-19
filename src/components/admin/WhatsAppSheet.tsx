'use client';
import { useState, useRef } from 'react';

type Props = {
  phone: string; // E.164, e.g. "+919241099696"
  initialMessage: string;
  onClose?: () => void;
};

export default function WhatsAppSheet({ phone, initialMessage, onClose }: Props) {
  const [message, setMessage] = useState(initialMessage);
  const ref = useRef<HTMLDivElement>(null);

  const waNumber = phone.replace(/^\+/, '');
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="wa-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Send WhatsApp message"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="wa-sheet" ref={ref}>
        <div className="wa-sheet-header">
          <span className="wa-sheet-title">WhatsApp message</span>
          <button
            className="wa-sheet-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        <textarea
          className="wa-sheet-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          aria-label="Edit message before sending"
        />
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-sheet-btn"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}
