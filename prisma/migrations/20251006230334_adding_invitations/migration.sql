-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userFromId" TEXT NOT NULL,
    "userToPhoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
