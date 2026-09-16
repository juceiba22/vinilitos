-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_activationCodeId_fkey";

-- DropIndex
DROP INDEX "Page_activationCodeId_key";

-- DropIndex
DROP INDEX "Page_activationBatchName_key";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "activationCodeId",
DROP COLUMN "activationBatchName",
ALTER COLUMN "editToken" DROP NOT NULL,
ALTER COLUMN "published" SET DEFAULT false;

-- DropTable
DROP TABLE "ActivationCode";

-- CreateTable
CREATE TABLE "LinkCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "nfcWritten" BOOLEAN NOT NULL DEFAULT false,
    "nfcWrittenAt" TIMESTAMP(3),
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkCode_code_key" ON "LinkCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LinkCode_linkId_key" ON "LinkCode"("linkId");

-- AddForeignKey
ALTER TABLE "LinkCode" ADD CONSTRAINT "LinkCode_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
