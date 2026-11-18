import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118074445 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "claim" add column if not exists "resolved_at" timestamptz null, add column if not exists "confirmed_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "claim" drop column if exists "resolved_at", drop column if exists "confirmed_at";`);
  }

}
