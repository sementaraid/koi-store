import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114174315 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "topup_request" add column if not exists "decided_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "topup_request" drop column if exists "decided_at";`);
  }

}
