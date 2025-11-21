-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ADVANCE', 'BROADCAST');

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "meetingType" "MeetingType" NOT NULL DEFAULT 'ADVANCE';
