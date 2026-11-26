import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125213000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "lot_payout" ("id" text not null, "lot_id" text not null, "seller_id" text not null, "gross_amount" integer not null, "status" text check ("status" in ('pending', 'due', 'paid', 'cancelled')) not null default 'pending', "due_reason" text check ("due_reason" in ('arrival_proof', 'shipped_3_days', 'replacement_arrived')) null, "due_at" timestamptz null, "arrival_proof_file_key" text null, "arrival_proof_uploaded_at" timestamptz null, "bank_fee" integer null, "paid_at" timestamptz null, "paid_by" text null, "transfer_reference" text null, "note" text null, "refund_kind" text check ("refund_kind" in ('claim_refund', 'never_shipped')) null, "refund_amount" integer null, "refund_reference" text null, "refund_note" text null, "refunded_at" timestamptz null, "refunded_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "lot_payout_pkey" primary key ("id"), constraint lot_payout_gross_non_negative check (gross_amount >= 0), constraint lot_payout_bank_fee_non_negative check (bank_fee IS NULL OR bank_fee >= 0), constraint lot_payout_refund_non_negative check (refund_amount IS NULL OR refund_amount >= 0));`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lot_payout_lot_id_unique" ON "lot_payout" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_payout_seller_id_status" ON "lot_payout" ("seller_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_payout_status_due_at" ON "lot_payout" ("status", "due_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_payout_deleted_at" ON "lot_payout" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "lot_payout" cascade;`);
  }

}
