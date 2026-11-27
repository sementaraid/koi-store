// Relative time in Indonesian, e.g. "2 jam yang lalu" or "kemarin". Used by the
// admin home activity list, where a queue row's exact WIB time reads too heavy.
// `date-fns` is not a dependency of this app, so this uses Intl instead.
const relative = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60]
];

export function relativeTimeLabel(iso: string, now: Date | string = new Date()): string {
  const then = new Date(iso).getTime();
  const current = typeof now === 'string' ? new Date(now).getTime() : now.getTime();
  if (Number.isNaN(then) || Number.isNaN(current)) return '';

  const seconds = (then - current) / 1000;
  if (Math.abs(seconds) < 60) return 'baru saja';

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }

  return 'baru saja';
}
