import { formatINR } from '@/lib/format/inr';

interface PriceTagProps {
  paise: number;
  from?: boolean;
  className?: string;
}

export function PriceTag({ paise, from = false, className = '' }: PriceTagProps) {
  return (
    <span className={`font-semibold text-[var(--text)] ${className}`}>
      {from && <span className="font-normal text-[var(--text-muted)] text-sm mr-0.5">from </span>}
      {formatINR(paise)}
    </span>
  );
}
