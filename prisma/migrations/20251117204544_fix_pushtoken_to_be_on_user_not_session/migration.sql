/*
  Warnings:

  - You are about to drop the column `pushToken` on the `session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "session" DROP COLUMN "pushToken";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "pushToken" TEXT;
