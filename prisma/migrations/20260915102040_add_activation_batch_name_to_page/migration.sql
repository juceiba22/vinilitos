-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "activationBatchName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Page_activationBatchName_key" ON "Page"("activationBatchName");
