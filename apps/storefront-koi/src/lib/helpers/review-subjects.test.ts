import assert from 'node:assert/strict';
import { test } from 'node:test';

import { reviewSubjects } from './review-subjects.ts';

const delivered = {
  payment_status: 'captured',
  fulfillment_status: 'delivered',
  seller: { id: 'sel_1', name: 'Dainichi Koi Farm' },
  items: [
    { product_id: 'prod_1', product_title: 'Kohaku 45cm' },
    { product_id: 'prod_2', product_title: 'Showa 30cm' }
  ]
};

test('a delivered parcel offers the farm first, then each fish', () => {
  const subjects = reviewSubjects(delivered);

  assert.deepEqual(
    subjects.map((s) => `${s.reference}:${s.referenceId}`),
    ['seller:sel_1', 'product:prod_1', 'product:prod_2']
  );
  assert.equal(subjects[0].name, 'Dainichi Koi Farm');
  assert.equal(subjects[1].name, 'Kohaku 45cm');
});

test('nothing to review until the parcel is delivered', () => {
  assert.deepEqual(
    reviewSubjects({ ...delivered, fulfillment_status: 'shipped' }),
    []
  );
  assert.deepEqual(
    reviewSubjects({ ...delivered, payment_status: 'awaiting' }),
    []
  );
});

test('the same koi twice in one parcel is one subject', () => {
  const subjects = reviewSubjects({
    ...delivered,
    items: [
      { product_id: 'prod_1', product_title: 'Kohaku 45cm' },
      { product_id: 'prod_1', product_title: 'Kohaku 45cm' }
    ]
  });

  assert.deepEqual(
    subjects.map((s) => `${s.reference}:${s.referenceId}`),
    ['seller:sel_1', 'product:prod_1']
  );
});

test('a line with no product id is skipped rather than offered as a 400', () => {
  const subjects = reviewSubjects({
    ...delivered,
    items: [{ product_id: null, title: 'Kohaku 45cm' }]
  });

  assert.deepEqual(
    subjects.map((s) => s.reference),
    ['seller']
  );
});
