-- AlterTable
ALTER TABLE "ActivationCode" ADD COLUMN     "nfcWritten" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nfcWrittenAt" TIMESTAMP(3);
