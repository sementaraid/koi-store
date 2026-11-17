import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261117153728 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "claim" add column if not exists "approved_at" timestamptz null, add column if not exists "farmer_decided_at" timestamptz null, add column if not exists "decided_by" text null, add column if not exists "decided_at" timestamptz null, add column if not exists "decision_reason" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "claim" drop column if exists "approved_at", drop column if exists "farmer_decided_at", drop column if exists "decided_by", drop column if exists "decided_at", drop column if exists "decision_reason";`);
  }

}
