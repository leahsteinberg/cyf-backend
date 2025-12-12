-- CreateEnum
CREATE TYPE "TimeType" AS ENUM ('IMMEDIATE', 'FUTURE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('OPEN', 'FRIEND_SPECIFIC', 'GROUP');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('USER_INTENT', 'SYSTEM_PATTERN', 'SYSTEM_REAL_TIME');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MeetingState" ADD VALUE 'DRAFT';
ALTER TYPE "MeetingState" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "intentLabel" TEXT,
ADD COLUMN     "sourceType" "SourceType",
ADD COLUMN     "targetType" "TargetType",
ADD COLUMN     "targetUserId" TEXT,
ADD COLUMN     "timeType" "TimeType";
