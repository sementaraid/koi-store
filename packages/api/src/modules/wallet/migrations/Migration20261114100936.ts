import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114100936 extends Migration {

  override async up(): Promise<void> {
    // Backfill raw_amount (Medusa bigNumber's exact-value column) before NOT NULL,
    // so the migration also works on a table that already holds rows.
    this.addSql(`alter table if exists "wallet_transaction" add column if not exists "raw_amount" jsonb null;`);
    this.addSql(`alter table if exists "wallet_transaction" alter column "amount" type numeric using ("amount"::numeric);`);
    this.addSql(`update "wallet_transaction" set "raw_amount" = jsonb_build_object('value', "amount"::text, 'precision', 20) where "raw_amount" is null;`);
    this.addSql(`alter table if exists "wallet_transaction" alter column "raw_amount" set not null;`);
    this.addSql(`alter table if exists "wallet_transaction" add constraint wallet_transaction_check check(amount = trunc(amount));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wallet_transaction" drop constraint if exists wallet_transaction_check;`);
    this.addSql(`alter table if exists "wallet_transaction" drop column if exists "raw_amount";`);

    this.addSql(`alter table if exists "wallet_transaction" alter column "amount" type integer using ("amount"::integer);`);
  }

}
