-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
