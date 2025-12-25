-- AlterTable
ALTER TABLE "meeting" DROP COLUMN "targetUserId";

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN "targetUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "meeting" ADD COLUMN "minParticipants" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "meeting" ADD COLUMN "maxParticipants" INTEGER NOT NULL DEFAULT 1;
