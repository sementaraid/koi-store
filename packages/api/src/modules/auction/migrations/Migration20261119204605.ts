import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261119204605 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "auction" add column if not exists "cancel_reason" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "auction" drop column if exists "cancel_reason";`);
  }

}
