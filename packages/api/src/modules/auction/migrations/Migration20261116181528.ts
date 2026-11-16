import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261116181528 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot" add column if not exists "tracking_number" text null, add column if not exists "shipped_at" timestamptz null, add column if not exists "delivered_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop column if exists "tracking_number", drop column if exists "shipped_at", drop column if exists "delivered_at";`);
  }

}
