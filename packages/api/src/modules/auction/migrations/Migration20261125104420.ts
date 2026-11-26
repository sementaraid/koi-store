import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125104420 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot" add column if not exists "paid_at" timestamptz null, add column if not exists "paid_confirmed_by" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop column if exists "paid_at", drop column if exists "paid_confirmed_by";`);
  }

}
