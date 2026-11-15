import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114083708 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "platform_setting" ("id" text not null, "extend_window_minutes" integer not null default 5, "max_lots_per_auction" integer not null default 20, "auction_min_days" integer not null default 1, "auction_max_days" integer not null default 7, "claim_window_hours" integer not null default 4, "bank_name" text not null default '', "bank_account_number" text not null default '', "bank_account_holder" text not null default '', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "platform_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_platform_setting_deleted_at" ON "platform_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "platform_setting" cascade;`);
  }

}
