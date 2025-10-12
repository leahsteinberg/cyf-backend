/*
  Warnings:

  - You are about to drop the column `acceptedById` on the `meeting` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."meeting" DROP CONSTRAINT "meeting_acceptedById_fkey";

-- AlterTable
ALTER TABLE "meeting" DROP COLUMN "acceptedById";
