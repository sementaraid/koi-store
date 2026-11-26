import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125203000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot" add column if not exists "payment_proof_file_key" text null, add column if not exists "payment_proof_status" text check ("payment_proof_status" in ('none', 'pending', 'rejected', 'confirmed')) not null default 'none', add column if not exists "payment_proof_reason" text null, add column if not exists "payment_proof_uploaded_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop column if exists "payment_proof_file_key", drop column if exists "payment_proof_status", drop column if exists "payment_proof_reason", drop column if exists "payment_proof_uploaded_at";`);
  }

}
