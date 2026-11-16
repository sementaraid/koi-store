import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261116164737 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot" add column if not exists "closed_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop column if exists "closed_at";`);
  }

}
