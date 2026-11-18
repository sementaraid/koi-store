import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118093221 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bid" add column if not exists "removed_at" timestamptz null, add column if not exists "removed_by" text null, add column if not exists "removed_reason" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bid" drop column if exists "removed_at", drop column if exists "removed_by", drop column if exists "removed_reason";`);
  }

}
