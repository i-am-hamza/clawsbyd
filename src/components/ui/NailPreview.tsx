'use client';

import { renderNailPreviewSVG, type NailPreviewProps } from '@/lib/nail-svg';

export function NailPreview(props: NailPreviewProps) {
  const { className, shape, length, colours, finish, gap } = props;
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: renderNailPreviewSVG({ shape, length, colours, finish, gap }),
      }}
      style={{ display: 'inline-flex', lineHeight: 0 }}
    />
  );
}
