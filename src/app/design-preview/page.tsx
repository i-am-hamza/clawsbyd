import { notFound } from 'next/navigation';
import DesignPreviewClient from './DesignPreviewClient';

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <DesignPreviewClient />;
}
