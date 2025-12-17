/*
  Warnings:

  - You are about to drop the `UserSignal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserSignal" DROP CONSTRAINT "UserSignal_userId_fkey";

-- DropTable
DROP TABLE "public"."UserSignal";

-- CreateTable
CREATE TABLE "userSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "payload" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userSignal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "userSignal" ADD CONSTRAINT "userSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
