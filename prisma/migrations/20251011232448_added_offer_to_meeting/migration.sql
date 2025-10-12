-- CreateTable
CREATE TABLE "offer" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userOfferedId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "rejected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_userOfferedId_fkey" FOREIGN KEY ("userOfferedId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
