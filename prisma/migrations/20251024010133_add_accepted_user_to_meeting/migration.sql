-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "acceptedUserId" TEXT;

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
