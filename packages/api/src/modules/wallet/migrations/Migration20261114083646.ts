import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114083646 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "wallet" ("id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_deleted_at" ON "wallet" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wallet_transaction" ("id" text not null, "type" text check ("type" in ('manual_topup', 'join_fee', 'listing_fee', 'adjustment', 'refund')) not null, "amount" integer not null, "reference" text null, "created_by" text null, "wallet_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_transaction_wallet_id" ON "wallet_transaction" ("wallet_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_transaction_deleted_at" ON "wallet_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_transaction_wallet_id_created_at" ON "wallet_transaction" ("wallet_id", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "wallet_transaction" add constraint "wallet_transaction_wallet_id_foreign" foreign key ("wallet_id") references "wallet" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wallet_transaction" drop constraint if exists "wallet_transaction_wallet_id_foreign";`);

    this.addSql(`drop table if exists "wallet" cascade;`);

    this.addSql(`drop table if exists "wallet_transaction" cascade;`);
  }

}
