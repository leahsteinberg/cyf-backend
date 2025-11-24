/*
  Warnings:

  - You are about to drop the column `broadcastSubState` on the `meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meeting" DROP COLUMN "broadcastSubState";

-- CreateTable
CREATE TABLE "broadcast_metadata" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "subState" "BroadcastSubState" NOT NULL DEFAULT 'UNCLAIMED',

    CONSTRAINT "broadcast_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_metadata_meetingId_key" ON "broadcast_metadata"("meetingId");

-- AddForeignKey
ALTER TABLE "broadcast_metadata" ADD CONSTRAINT "broadcast_metadata_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
