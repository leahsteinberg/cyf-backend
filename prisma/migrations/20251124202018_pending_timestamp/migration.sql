-- AlterTable
ALTER TABLE "broadcast_metadata" ADD COLUMN     "offerClaimedId" TEXT,
ADD COLUMN     "pendingAt" TIMESTAMP(3);
