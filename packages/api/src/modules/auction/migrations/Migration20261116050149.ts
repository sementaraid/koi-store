import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261116050149 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "bid" ("id" text not null, "customer_id" text not null, "amount" integer not null, "source" text check ("source" in ('web', 'whatsapp')) not null default 'web', "lot_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bid_pkey" primary key ("id"), constraint bid_amount_positive check (amount >= 1));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bid_lot_id" ON "bid" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bid_deleted_at" ON "bid" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "bid" add constraint "bid_lot_id_foreign" foreign key ("lot_id") references "lot" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "bid" cascade;`);
  }

}
