-- AddForeignKey
ALTER TABLE "broadcast_metadata" ADD CONSTRAINT "broadcast_metadata_offerClaimedId_fkey" FOREIGN KEY ("offerClaimedId") REFERENCES "offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
