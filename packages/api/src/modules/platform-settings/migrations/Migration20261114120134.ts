import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114120134 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "platform_setting" add column if not exists "singleton" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "platform_setting" drop column if exists "singleton";`);
  }

}
