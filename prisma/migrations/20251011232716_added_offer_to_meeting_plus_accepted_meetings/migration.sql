/*
  Warnings:

  - Added the required column `acceptedById` to the `meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "acceptedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
