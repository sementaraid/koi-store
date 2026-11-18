import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118064124 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "strike" ("id" text not null, "customer_id" text not null, "seller_id" text null, "lot_id" text null, "reason_type" text check ("reason_type" in ('winner_unpaid', 'farmer_not_shipped', 'farmer_claim_refused')) not null, "reason" text not null, "created_by" text not null, "removed_at" timestamptz null, "removed_by" text null, "removed_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "strike_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_strike_deleted_at" ON "strike" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_strike_customer_id_created_at" ON "strike" ("customer_id", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_strike_lot_id" ON "strike" ("lot_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "strike" cascade;`);
  }

}
