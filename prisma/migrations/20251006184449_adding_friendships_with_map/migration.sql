/*
  Warnings:

  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_userId1_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_userId2_fkey";

-- DropTable
DROP TABLE "public"."Friendship";

-- CreateTable
CREATE TABLE "friendship" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,

    CONSTRAINT "friendship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
