import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125175906 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot" add column if not exists "variety" text null, add column if not exists "size_cm" integer null, add column if not exists "age" text null, add column if not exists "sex" text null, add column if not exists "has_certificate" boolean null, add column if not exists "certificate_issuer" text null, add column if not exists "pond_origin" text null, add column if not exists "breeder_notes" text null, add column if not exists "video_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop column if exists "variety", drop column if exists "size_cm", drop column if exists "age", drop column if exists "sex", drop column if exists "has_certificate", drop column if exists "certificate_issuer", drop column if exists "pond_origin", drop column if exists "breeder_notes", drop column if exists "video_url";`);
  }

}
