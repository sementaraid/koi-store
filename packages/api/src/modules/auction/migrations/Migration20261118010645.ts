import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118010645 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "auction" add column if not exists "live_stream_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "auction" drop column if exists "live_stream_url";`);
  }

}
