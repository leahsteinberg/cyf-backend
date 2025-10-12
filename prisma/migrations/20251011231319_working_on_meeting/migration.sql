-- CreateTable
CREATE TABLE "meeting" (
    "id" TEXT NOT NULL,
    "userFromId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
