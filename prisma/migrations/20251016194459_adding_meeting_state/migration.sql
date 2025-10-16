-- CreateEnum
CREATE TYPE "MeetingState" AS ENUM ('SEARCHING', 'ACCEPTED', 'REJECTED', 'PAST');

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "meetingState" "MeetingState" NOT NULL DEFAULT 'SEARCHING',
ADD COLUMN     "title" TEXT;
