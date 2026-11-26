import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261125174559 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "lot_participant" drop constraint if exists "lot_participant_lot_id_customer_id_unique";`);
    this.addSql(`create table if not exists "lot_participant" ("id" text not null, "customer_id" text not null, "paid_join_fee" integer not null, "lot_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "lot_participant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_participant_lot_id" ON "lot_participant" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_participant_deleted_at" ON "lot_participant" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lot_participant_lot_id_customer_id_unique" ON "lot_participant" ("lot_id", "customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "lot_participant" add constraint "lot_participant_lot_id_foreign" foreign key ("lot_id") references "lot" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "lot_participant" cascade;`);
  }

}
