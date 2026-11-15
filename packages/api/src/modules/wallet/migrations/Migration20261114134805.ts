import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114134805 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "topup_request" ("id" text not null, "amount" numeric not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "screenshot_url" text not null, "reviewed_by" text null, "reason" text null, "wallet_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "topup_request_pkey" primary key ("id"), constraint topup_request_check check (amount = trunc(amount) AND amount >= 1));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_topup_request_wallet_id" ON "topup_request" ("wallet_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_topup_request_deleted_at" ON "topup_request" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_topup_request_wallet_id_created_at" ON "topup_request" ("wallet_id", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "topup_request" add constraint "topup_request_wallet_id_foreign" foreign key ("wallet_id") references "wallet" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "topup_request" cascade;`);
  }

}
