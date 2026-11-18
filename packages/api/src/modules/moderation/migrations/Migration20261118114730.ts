import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261118114730 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "claim" add column if not exists "video_deleted_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "claim" drop column if exists "video_deleted_at";`);
  }

}
