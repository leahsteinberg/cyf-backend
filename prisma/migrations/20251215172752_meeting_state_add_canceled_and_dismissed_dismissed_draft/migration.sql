/*
  Warnings:

  - The values [DISMISSED] on the enum `MeetingState` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeetingState_new" AS ENUM ('DRAFT', 'SEARCHING', 'ACCEPTED', 'REJECTED', 'PAST', 'EXPIRED', 'DISMISSED_DRAFT', 'CANCELED');
ALTER TABLE "public"."meeting" ALTER COLUMN "meetingState" DROP DEFAULT;
ALTER TABLE "meeting" ALTER COLUMN "meetingState" TYPE "MeetingState_new" USING ("meetingState"::text::"MeetingState_new");
ALTER TYPE "MeetingState" RENAME TO "MeetingState_old";
ALTER TYPE "MeetingState_new" RENAME TO "MeetingState";
DROP TYPE "public"."MeetingState_old";
ALTER TABLE "meeting" ALTER COLUMN "meetingState" SET DEFAULT 'SEARCHING';
COMMIT;
