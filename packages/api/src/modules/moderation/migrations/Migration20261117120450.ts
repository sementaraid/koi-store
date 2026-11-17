import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261117120450 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "claim" drop constraint if exists "claim_lot_id_unique";`);
    this.addSql(`create table if not exists "claim" ("id" text not null, "lot_id" text not null, "customer_id" text not null, "seller_id" text not null, "remedy" text check ("remedy" in ('refund', 'replacement')) not null, "status" text check ("status" in ('open', 'approved', 'disputed', 'rejected', 'resolved', 'confirmed')) not null default 'open', "video_file_key" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "claim_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_claim_deleted_at" ON "claim" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_claim_lot_id_unique" ON "claim" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_claim_seller_id_status" ON "claim" ("seller_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_claim_customer_id" ON "claim" ("customer_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "claim" cascade;`);
  }

}
