import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118092043 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "farmer_rating" drop constraint if exists "farmer_rating_lot_id_unique";`);
    this.addSql(`create table if not exists "farmer_rating" ("id" text not null, "lot_id" text not null, "customer_id" text not null, "seller_id" text not null, "stars" integer not null, "comment" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "farmer_rating_pkey" primary key ("id"), constraint farmer_rating_stars_range check (stars >= 1 AND stars <= 5), constraint farmer_rating_comment_length check (comment IS NULL OR char_length(comment) <= 300));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_farmer_rating_deleted_at" ON "farmer_rating" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_farmer_rating_lot_id_unique" ON "farmer_rating" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_farmer_rating_seller_id_created_at" ON "farmer_rating" ("seller_id", "created_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "farmer_rating" cascade;`);
  }

}
