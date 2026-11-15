import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261115142217 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pii_reveal_audit" ("id" text not null, "actor_type" text not null, "actor_id" text not null, "record_type" text not null, "record_id" text not null, "field" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pii_reveal_audit_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pii_reveal_audit_deleted_at" ON "pii_reveal_audit" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pii_reveal_audit_record_type_record_id" ON "pii_reveal_audit" ("record_type", "record_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pii_reveal_audit" cascade;`);
  }

}
