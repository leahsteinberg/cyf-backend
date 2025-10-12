/*
  Warnings:

  - You are about to drop the column `accepted` on the `offer` table. All the data in the column will be lost.
  - You are about to drop the column `open` on the `offer` table. All the data in the column will be lost.
  - You are about to drop the column `rejected` on the `offer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OfferState" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "offer" DROP COLUMN "accepted",
DROP COLUMN "open",
DROP COLUMN "rejected",
ADD COLUMN     "offerState" "OfferState" NOT NULL DEFAULT 'OPEN';
