import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114134806 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fee_category" drop constraint if exists "fee_category_name_unique";`);
    this.addSql(`create table if not exists "fee_category" ("id" text not null, "name" text not null, "listing_fee" integer not null, "join_fee" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fee_category_pkey" primary key ("id"), constraint fee_category_check check (listing_fee >= 0 AND join_fee >= 0));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fee_category_deleted_at" ON "fee_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fee_category_name_unique" ON "fee_category" ("name") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fee_category" cascade;`);
  }

}
