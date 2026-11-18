'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Radio } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, RenderIf } from '@koi/ui';
import { setAuctionLiveLink, type Auction } from '@/lib/data/auctions';
import { isLiveStreamUrl } from '@/lib/helpers/live-stream-url';
import { stripValidationPrefix } from '@/lib/helpers/validation-message';

const schema = z.object({
  live_stream_url: z.string().trim().max(2048, 'Tautan maksimal 2048 karakter.')
});

type FormData = z.infer<typeof schema>;

const EDITABLE_STATUSES = ['draft', 'pending_approval', 'scheduled', 'live'];

export type LiveLinkFormProps = {
  auction: Auction;
  onSaved: (auction: Auction) => void;
};

export function LiveLinkForm({ auction, onSaved }: LiveLinkFormProps) {
  const editable = EDITABLE_STATUSES.includes(auction.status);
  const stored = auction.live_stream_url;
  const [busy, setBusy] = useState<'save' | 'clear' | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { live_stream_url: stored ?? '' }
  });

  async function save(data: FormData) {
    const url = data.live_stream_url.trim();
    if (!url) {
      await clear();
      return;
    }
    if (!isLiveStreamUrl(url)) {
      setError('live_stream_url', {
        message: 'Tautan harus dari YouTube atau Instagram (https).'
      });
    }

    setBusy('save');
    const result = await setAuctionLiveLink(auction.id, url);
    setBusy(null);

    if (!result.success) {
      toast.error(stripValidationPrefix(result.error));
      return;
    }

    reset({ live_stream_url: result.data.live_stream_url ?? '' });
    onSaved(result.data);
    toast.success('Tautan siaran tersimpan.');
  }

  async function clear() {
    setBusy('clear');
    const result = await setAuctionLiveLink(auction.id, null);
    setBusy(null);

    if (!result.success) {
      toast.error(stripValidationPrefix(result.error));
      return;
    }

    reset({ live_stream_url: '' });
    onSaved(result.data);
    toast.success('Tautan siaran dihapus.');
  }

  return (
    <Card className="px-5 py-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio aria-hidden className="size-4" />
          Tautan siaran
        </CardTitle>
        <CardDescription>
          Tautan YouTube atau Instagram untuk siaran lelang. Tidak ada video yang diunggah ke
          Koi Store.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-0 pb-0 text-sm">
        <RenderIf when={stored}>
          {(url) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all font-medium text-info underline underline-offset-2"
            >
              {url}
              <ExternalLink aria-hidden className="size-3.5 shrink-0" />
            </a>
          )}
        </RenderIf>
        <RenderIf when={!stored}>
          {() => <p className="text-muted-foreground">Belum ada tautan siaran.</p>}
        </RenderIf>

        <RenderIf when={editable}>
          {() => (
            <form onSubmit={handleSubmit(save)} className="grid gap-3" noValidate>
              <FormField
                label="Tautan siaran"
                type="url"
                inputMode="url"
                placeholder="https://www.youtube.com/live/…"
                error={errors.live_stream_url?.message}
                disabled={busy !== null}
                {...register('live_stream_url')}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy !== null}>
                  {busy === 'save' ? 'Menyimpan…' : 'Simpan tautan'}
                </Button>
                <RenderIf when={stored}>
                  {() => (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={clear}
                    >
                      {busy === 'clear' ? 'Menghapus…' : 'Hapus tautan'}
                    </Button>
                  )}
                </RenderIf>
              </div>
            </form>
          )}
        </RenderIf>

        <RenderIf when={!editable}>
          {() => (
            <p className="text-xs text-muted-foreground">
              Lelang sudah selesai, jadi tautan siaran tidak bisa diubah.
            </p>
          )}
        </RenderIf>
      </CardContent>
    </Card>
  );
}
