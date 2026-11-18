import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118003301 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot_report" drop constraint if exists "lot_report_lot_id_unique";`);
    this.addSql(`create table if not exists "lot_report" ("id" text not null, "lot_id" text not null, "seller_id" text not null, "winner_customer_id" text not null, "status" text check ("status" in ('open')) not null default 'open', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "lot_report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_report_deleted_at" ON "lot_report" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lot_report_lot_id_unique" ON "lot_report" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_report_winner_customer_id" ON "lot_report" ("winner_customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_report_seller_id_status" ON "lot_report" ("seller_id", "status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "lot_report" cascade;`);
  }

}
