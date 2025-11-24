-- CreateEnum
CREATE TYPE "BroadcastSubState" AS ENUM ('PENDING_CLAIMED', 'UNCLAIMED');

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "broadcastSubState" "BroadcastSubState" DEFAULT 'UNCLAIMED';
