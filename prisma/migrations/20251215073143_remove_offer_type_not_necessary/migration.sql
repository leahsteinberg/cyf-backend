/*
  Warnings:

  - You are about to drop the column `offerType` on the `offer` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "MeetingState" ADD VALUE 'DISMISSED';

-- AlterTable
ALTER TABLE "offer" DROP COLUMN "offerType";
