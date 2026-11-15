import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261115115753 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "auction" ("id" text not null, "seller_id" text not null, "fee_category_id" text not null, "start_at" timestamptz not null, "end_at" timestamptz not null, "delivery_method" text check ("delivery_method" in ('self_delivery', 'courier')) not null, "status" text check ("status" in ('draft', 'pending_approval', 'scheduled', 'live', 'closed', 'cancelled')) not null default 'draft', "listing_fee" integer not null, "join_fee" integer not null, "extend_window_minutes" integer not null, "payer_customer_id" text null, "fee_override_listing_fee" integer null, "fee_override_join_fee" integer null, "fee_override_reason" text null, "rejection_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "auction_pkey" primary key ("id"), constraint auction_fees_non_negative check (listing_fee >= 0 AND join_fee >= 0), constraint auction_extend_window_positive check (extend_window_minutes > 0), constraint auction_dates_ordered check (start_at < end_at));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_deleted_at" ON "auction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_seller_id" ON "auction" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_auction_status" ON "auction" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "lot" ("id" text not null, "product_id" text not null, "ob" integer not null, "kb" integer not null, "current_price" integer not null, "end_time" timestamptz not null, "winner_customer_id" text null, "final_price" integer null, "status" text check ("status" in ('open', 'unsold', 'won', 'paid', 'shipped', 'delivered', 'claimed', 'cancelled')) not null default 'open', "cancel_reason" text null, "auction_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "lot_pkey" primary key ("id"), constraint lot_prices_positive check (ob >= 1 AND kb >= 1), constraint lot_current_price_at_least_ob check (current_price >= ob));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_auction_id" ON "lot" ("auction_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lot_deleted_at" ON "lot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "lot" add constraint "lot_auction_id_foreign" foreign key ("auction_id") references "auction" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "lot" drop constraint if exists "lot_auction_id_foreign";`);

    this.addSql(`drop table if exists "auction" cascade;`);

    this.addSql(`drop table if exists "lot" cascade;`);
  }

}
