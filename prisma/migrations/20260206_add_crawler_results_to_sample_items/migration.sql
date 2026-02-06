-- AlterTable
ALTER TABLE "sample_items" ADD COLUMN "crawled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "crawler_results" ADD COLUMN "sample_item_id" TEXT;

-- AlterTable
ALTER TABLE "crawler_results" ALTER COLUMN "scope_url_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "crawler_results" ADD CONSTRAINT "crawler_results_sample_item_id_fkey" FOREIGN KEY ("sample_item_id") REFERENCES "sample_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;