import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261115211617 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "auction_participant" drop constraint if exists "auction_participant_auction_id_customer_id_unique";`);
    this.addSql(`create table if not exists "auction_participant" ("id" text not null, "customer_id" text not null, "auction_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "auction_participant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_participant_auction_id" ON "auction_participant" ("auction_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_participant_deleted_at" ON "auction_participant" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_auction_participant_auction_id_customer_id_unique" ON "auction_participant" ("auction_id", "customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "auction_participant" add constraint "auction_participant_auction_id_foreign" foreign key ("auction_id") references "auction" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "auction_participant" cascade;`);
  }

}
