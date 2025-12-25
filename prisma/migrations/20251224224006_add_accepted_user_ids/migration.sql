-- AlterTable
ALTER TABLE "meeting" ADD COLUMN "acceptedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
