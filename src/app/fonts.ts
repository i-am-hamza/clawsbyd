import {
  Bodoni_Moda,
  Instrument_Sans,
} from 'next/font/google';

export const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  axes: ['opsz'],
  weight: 'variable',
  style: ['normal', 'italic'],
  variable: '--font-display-a',
  display: 'swap',
});

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  weight: 'variable',
  variable: '--font-body-a',
  display: 'swap',
});
