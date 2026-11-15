import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261114151409 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "topup_request" rename column "screenshot_url" to "screenshot_file_key";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "topup_request" rename column "screenshot_file_key" to "screenshot_url";`);
  }

}
