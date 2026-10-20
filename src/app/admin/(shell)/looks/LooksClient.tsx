'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import { compressImage } from '@/lib/images/compress';
import {
  actionCreateLook,
  actionUpdateLook,
  actionDeleteLookWithBlobs,
  actionReorderLooks,
  actionBulkUpdate,
} from './actions';
import './looks.css';

type LookMedia = {
  media: {
    id: string; url: string; pathname: string;
    width: number | null; height: number | null; blurDataUrl: string | null; alt: string;
  };
  sortOrder: number;
  isCover: boolean;
};

type Look = {
  id: string;
  slug: string;
  title: string | null;
  caption: string | null;
  glamLevel: number;
  shape: string;
  length: string;
  occasions: string[];
  colours: string[];
  isFeatured: boolean;
  isPublished: boolean;
  isPlaceholder: boolean;
  sortOrder: number;
  mediaItems: LookMedia[];
};

const GLAM_LABELS: Record<number, string> = { 1: 'Soft', 2: 'Everyday', 3: 'Polished', 4: 'Glam', 5: 'Statement' };
const SHAPES = ['square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto'] as const;
const LENGTHS = ['short', 'medium', 'long', 'xl'] as const;
const OCCASIONS = ['everyday', 'party', 'bridal', 'festive', 'college'] as const;

export default function LooksClient({ initialLooks }: { initialLooks: Look[] }) {
  const [looks, setLooks] = useState(initialLooks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Look | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);

  // ── Upload new looks ──────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);

    const progress: Record<string, number> = {};
    const uploadedMedia: Array<{
      url: string; pathname: string;
      width: number; height: number; blurDataUrl: string; alt: string;
      isCover: boolean; sortOrder: number;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const key = `${i}-${file.name}`;
      progress[key] = 0;
      setUploadProgress({ ...progress });

      try {
        const { file: compressed, width, height, blurDataUrl } = await compressImage(file);
        const pathname = `portfolio/look-${Date.now()}-${i}.${compressed.name.split('.').pop()}`;

        const blob = await upload(pathname, compressed, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
          clientPayload: 'portfolio',
          onUploadProgress: ({ percentage }) => {
            progress[key] = percentage;
            setUploadProgress({ ...progress });
          },
        });

        uploadedMedia.push({
          url: blob.url,
          pathname: blob.pathname,
          width,
          height,
          blurDataUrl,
          alt: file.name.replace(/\.[^.]+$/, ''),
          isCover: i === 0,
          sortOrder: i,
        });
      } catch (err) {
        console.error('Upload failed for', file.name, err);
      }
    }

    if (uploadedMedia.length > 0) {
      startTransition(async () => {
        try {
          await actionCreateLook({
            glamLevel: 3,
            shape: 'oval',
            length: 'medium',
            title: null,
            media: uploadedMedia,
          });
          // Reload
          window.location.reload();
        } catch (err) {
          console.error('Create look failed', err);
        }
      });
    }

    setUploading(false);
    setUploadProgress({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    e.target.value = '';
  }

  // ── Tag sheet save ────────────────────────────────────────────────────────
  async function handleSaveTags(patch: Partial<Look>) {
    if (!editing) return;
    startTransition(async () => {
      try {
        await actionUpdateLook({ id: editing.id, ...patch });
        setLooks((prev) =>
          prev.map((l) => (l.id === editing.id ? { ...l, ...patch } : l))
        );
        setEditing(null);
      } catch (err) {
        console.error(err);
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(look: Look) {
    if (!confirm(`Delete "${look.title ?? 'this look'}"? This cannot be undone.`)) return;
    const urls = look.mediaItems.map((m) => m.media.url);
    startTransition(async () => {
      try {
        await actionDeleteLookWithBlobs(look.id, urls);
        setLooks((prev) => prev.filter((l) => l.id !== look.id));
        setSelected((prev) => { const n = new Set(prev); n.delete(look.id); return n; });
      } catch (err) {
        console.error(err);
      }
    });
  }

  // ── Drag reorder ──────────────────────────────────────────────────────────
  function handleDragStart(idx: number) { dragItem.current = idx; }
  function handleDrop(idx: number) {
    if (dragItem.current === null || dragItem.current === idx) return;
    const next = [...looks];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(idx, 0, moved!);
    dragItem.current = null;
    setLooks(next);
    startTransition(() => void actionReorderLooks(next.map((l) => l.id)));
  }

  // ── Up/down fallback ──────────────────────────────────────────────────────
  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= looks.length) return;
    const next = [...looks];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setLooks(next);
    startTransition(() => void actionReorderLooks(next.map((l) => l.id)));
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const allSelected = looks.length > 0 && selected.size === looks.length;

  async function handleBulkPublish(pub: boolean) {
    startTransition(async () => {
      await actionBulkUpdate({ ids: [...selected], isPublished: pub });
      setLooks((prev) => prev.map((l) => (selected.has(l.id) ? { ...l, isPublished: pub } : l)));
      setSelected(new Set());
    });
  }

  const totalProgress = Object.values(uploadProgress);
  const avgProgress = totalProgress.length
    ? Math.round(totalProgress.reduce((a, b) => a + b, 0) / totalProgress.length)
    : 0;

  return (
    <div className="looks-page">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="looks-toolbar">
        <button
          className="looks-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isPending}
          aria-busy={uploading}
        >
          {uploading ? `Uploading… ${avgProgress}%` : '+ Add photos'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-label="Select photos to upload"
        />
        {selected.size > 0 && (
          <div className="looks-bulk">
            <span className="looks-bulk-count">{selected.size} selected</span>
            <button onClick={() => handleBulkPublish(true)} disabled={isPending}>Publish</button>
            <button onClick={() => handleBulkPublish(false)} disabled={isPending}>Unpublish</button>
            <button onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
        <button
          className="looks-select-all"
          onClick={() => setSelected(allSelected ? new Set() : new Set(looks.map((l) => l.id)))}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* ── Per-file upload progress ─────────────────────────────────────── */}
      {uploading && (
        <div className="looks-progress-list" role="status" aria-live="polite">
          {Object.entries(uploadProgress).map(([key, pct]) => (
            <div key={key} className="looks-progress-item">
              <span>{key.replace(/^\d+-/, '')}</span>
              <progress value={pct} max={100}>{pct}%</progress>
            </div>
          ))}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {looks.length === 0 ? (
        <p className="looks-empty">No looks yet — upload some photos to get started.</p>
      ) : (
        <ol className="looks-grid" aria-label="Looks">
          {looks.map((look, idx) => {
            const cover = look.mediaItems.find((m) => m.isCover) ?? look.mediaItems[0];
            const isSelected = selected.has(look.id);
            return (
              <li
                key={look.id}
                className={`looks-card${isSelected ? ' is-selected' : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                aria-label={look.title ?? `Look ${idx + 1}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="looks-check"
                  checked={isSelected}
                  onChange={() =>
                    setSelected((prev) => {
                      const n = new Set(prev);
                      if (n.has(look.id)) n.delete(look.id); else n.add(look.id);
                      return n;
                    })
                  }
                  aria-label={`Select ${look.title ?? 'look'}`}
                />

                {/* Cover image */}
                {cover ? (
                  <div className="looks-card-img">
                    <Image
                      src={cover.media.url}
                      alt={cover.media.alt || look.title || 'Look'}
                      fill
                      sizes="(max-width:768px) 45vw, 220px"
                    />
                  </div>
                ) : (
                  <div className="looks-card-img looks-card-img--empty">No image</div>
                )}

                {/* Badges */}
                <div className="looks-badges">
                  {!look.isPublished && <span className="badge badge--draft">Draft</span>}
                  {look.isPublished && <span className="badge badge--pub">Published</span>}
                  {look.isFeatured && <span className="badge badge--feat">Featured</span>}
                  {look.isPlaceholder && <span className="badge badge--placeholder">Sample</span>}
                </div>

                {/* Info */}
                <div className="looks-card-info">
                  <span className="looks-glam">G{look.glamLevel} · {GLAM_LABELS[look.glamLevel]}</span>
                  <span className="looks-meta">{look.shape} · {look.length}</span>
                  {look.title && <span className="looks-title">{look.title}</span>}
                </div>

                {/* Actions */}
                <div className="looks-card-actions">
                  <button
                    className="looks-btn-edit"
                    onClick={() => setEditing(look)}
                    aria-label={`Edit tags for ${look.title ?? 'look'}`}
                  >
                    Edit
                  </button>
                  <div className="looks-reorder">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === looks.length - 1} aria-label="Move down">↓</button>
                  </div>
                  <button
                    className="looks-btn-delete"
                    onClick={() => handleDelete(look)}
                    aria-label={`Delete ${look.title ?? 'look'}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* ── Tag sheet (modal) ────────────────────────────────────────────── */}
      {editing && (
        <TagSheet look={editing} onSave={handleSaveTags} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag sheet
// ---------------------------------------------------------------------------

function TagSheet({
  look,
  onSave,
  onClose,
}: {
  look: Look;
  onSave: (patch: Partial<Look>) => void;
  onClose: () => void;
}) {
  const [glamLevel, setGlamLevel] = useState(look.glamLevel);
  const [shape, setShape] = useState(look.shape);
  const [length, setLength] = useState(look.length);
  const [occasions, setOccasions] = useState<string[]>(look.occasions);
  const [colours, setColours] = useState(look.colours.join(', '));
  const [title, setTitle] = useState(look.title ?? '');
  const [caption, setCaption] = useState(look.caption ?? '');
  const [isFeatured, setIsFeatured] = useState(look.isFeatured);
  const [isPublished, setIsPublished] = useState(look.isPublished);

  function toggleOccasion(occ: string) {
    setOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  }

  function submit() {
    onSave({
      glamLevel,
      shape,
      length,
      occasions,
      colours: colours.split(',').map((c) => c.trim()).filter(Boolean),
      title: title.trim() || null,
      caption: caption.trim() || null,
      isFeatured,
      isPublished,
    });
  }

  return (
    <div className="tag-sheet-overlay" role="dialog" aria-modal="true" aria-label="Edit look tags">
      <div className="tag-sheet">
        <div className="tag-sheet-header">
          <h2>Edit look</h2>
          <button className="tag-sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="tag-sheet-body">
          {/* Glam level */}
          <fieldset className="tag-section">
            <legend>Glam level</legend>
            <div className="glam-chips">
              {([1, 2, 3, 4, 5] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`glam-chip${glamLevel === g ? ' glam-chip--active' : ''}`}
                  onClick={() => setGlamLevel(g)}
                  aria-pressed={glamLevel === g}
                >
                  {g} · {GLAM_LABELS[g]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Shape */}
          <fieldset className="tag-section">
            <legend>Shape</legend>
            <div className="tag-chips">
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tag-chip${shape === s ? ' tag-chip--active' : ''}`}
                  onClick={() => setShape(s)}
                  aria-pressed={shape === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Length */}
          <fieldset className="tag-section">
            <legend>Length</legend>
            <div className="tag-chips">
              {LENGTHS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`tag-chip${length === l ? ' tag-chip--active' : ''}`}
                  onClick={() => setLength(l)}
                  aria-pressed={length === l}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Occasions */}
          <fieldset className="tag-section">
            <legend>Occasions</legend>
            <div className="tag-chips">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  className={`tag-chip${occasions.includes(occ) ? ' tag-chip--active' : ''}`}
                  onClick={() => toggleOccasion(occ)}
                  aria-pressed={occasions.includes(occ)}
                >
                  {occ}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Colours */}
          <div className="tag-section">
            <label htmlFor="look-colours">Colours (comma-separated)</label>
            <input
              id="look-colours"
              type="text"
              value={colours}
              onChange={(e) => setColours(e.target.value)}
              placeholder="e.g. nude, pink, silver"
              className="tag-input"
            />
          </div>

          {/* Title */}
          <div className="tag-section">
            <label htmlFor="look-title">Title (optional)</label>
            <input
              id="look-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="tag-input"
            />
          </div>

          {/* Caption */}
          <div className="tag-section">
            <label htmlFor="look-caption">Caption (optional)</label>
            <textarea
              id="look-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={3}
              className="tag-input"
            />
          </div>

          {/* Toggles */}
          <div className="tag-toggles">
            <label className="tag-toggle">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Featured
            </label>
            <label className="tag-toggle">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Published
            </label>
          </div>
        </div>

        <div className="tag-sheet-footer">
          <button className="tag-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tag-btn-save" onClick={submit}>Save</button>
        </div>
      </div>
    </div>
  );
}
