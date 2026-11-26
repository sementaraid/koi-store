'use client';

import { ImageUp, Plus, Upload, Video, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from 'cn';

import { Button, Label, RenderIf } from '@koi/ui';
import { formatFileSize } from '@/lib/helpers/topup-request';

export type FileFieldProps = {
  id: string;
  label: string;
  /** Accepted types and size, or what the photo is used for. */
  hint?: ReactNode;
  error?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  files: File[];
  onChoose: (files: File[]) => void;
  onRemove: (index: number) => void;
  /** Only on a page that already offered a drop zone. */
  dragAndDrop?: boolean;
  emptyLabel?: string;
  dragLabel?: string;
  /** 'Terpilih' before an upload, 'Terunggah' after one. */
  fileStatus?: string;
  className?: string;
};

/**
 * One file picker: the label, the control, and the chosen files.
 *
 * @remarks
 * Eight screens had their own `sr-only` input and trigger. This keeps the look
 * and the keyboard path the same everywhere: the visible trigger is a button,
 * and the native input stays out of the tab order. It never validates: the
 * page keeps its own accept list, size limit and error copy, and hands the
 * chosen files back through `onChoose`.
 */
export function FileField({
  id,
  label,
  hint,
  error,
  accept,
  multiple = false,
  disabled = false,
  files,
  onChoose,
  onRemove,
  dragAndDrop = false,
  emptyLabel = 'Pilih file',
  dragLabel = 'atau tarik file ke sini',
  fileStatus = 'Terpilih',
  className
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function choose(list: FileList | null) {
    const picked = Array.from(list ?? []);
    if (!picked.length) return;
    onChoose(multiple ? picked : picked.slice(0, 1));
  }

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label id={labelId}>{label}</Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={event => {
          choose(event.target.files);
          // Picking the same file again must still fire, after an error or a remove.
          event.target.value = '';
        }}
      />

      {files.length ? (
        <div className="grid gap-2">
          <ul className="grid gap-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-field bg-field px-3 py-2.5"
              >
                <FilePreview file={file} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileStatus} · {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!multiple ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={openPicker}
                      disabled={disabled}
                    >
                      Ganti
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus ${file.name}`}
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {multiple ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={openPicker}
              disabled={disabled}
            >
              <Plus aria-hidden />
              Tambah file
            </Button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onDragOver={
            dragAndDrop
              ? event => {
                  event.preventDefault();
                  setDragging(true);
                }
              : undefined
          }
          onDragLeave={dragAndDrop ? () => setDragging(false) : undefined}
          onDrop={
            dragAndDrop
              ? event => {
                  event.preventDefault();
                  setDragging(false);
                  choose(event.dataTransfer.files);
                }
              : undefined
          }
          className={cn(
            'flex min-h-14 w-full items-center gap-3 rounded-field bg-field px-4 py-3 text-left transition-colors focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            dragging ? 'bg-accent ring-[1.5px] ring-ring ring-inset' : 'hover:bg-accent/60'
          )}
        >
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-background text-accent-ink"
          >
            <Upload className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{emptyLabel}</span>
            {dragAndDrop ? (
              <span className="block text-xs text-muted-foreground">{dragLabel}</span>
            ) : null}
          </span>
        </button>
      )}

      <RenderIf when={hint}>
        {node => (
          <div id={hintId} className="text-xs text-muted-foreground">
            {node}
          </div>
        )}
      </RenderIf>
      <RenderIf when={error}>
        {message => (
          <p id={errorId} role="alert" className="text-xs text-destructive-ink">
            {message}
          </p>
        )}
      </RenderIf>
    </div>
  );
}

function FilePreview({ file }: { file: File }) {
  const isImage = file.type.startsWith('image/');
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) {
      setUrl(null);
      return;
    }

    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file, isImage]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a catalog image
      <img
        src={url}
        alt=""
        className="size-12 shrink-0 rounded-control object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-12 shrink-0 place-items-center rounded-control bg-background text-muted-foreground"
    >
      {isImage ? <ImageUp className="size-5" /> : <Video className="size-5" />}
    </span>
  );
}
