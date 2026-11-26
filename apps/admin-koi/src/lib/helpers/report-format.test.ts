import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatReportedAt,
  reportDeadlineLabel,
  reportStatusLabel
} from './report-format.ts';

test('labels the report state the backend can send', () => {
  assert.equal(reportStatusLabel('open'), 'Terbuka');
});

test('reads the reported time in Jakarta time, labelled WIB', () => {
  const formatted = formatReportedAt('2026-11-14T17:20:00.000Z');
  assert.match(formatted, /2026/);
  assert.match(formatted, /15/);
  assert.match(formatted, / WIB$/);
});

test('reads the payment deadline in Jakarta time, labelled WIB', () => {
  const label = reportDeadlineLabel('2026-11-15T17:20:00.000Z');
  assert.match(label, /^Batas bayar /);
  assert.match(label, /16/);
  assert.match(label, / WIB$/);
});

test('a lot without a closed_at has no deadline to show', () => {
  assert.equal(reportDeadlineLabel(null), 'Batas bayar tidak tercatat');
});
