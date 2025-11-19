import type { Meeting, Offer } from "../../types.js";
import { prisma } from "../auth.js";

export const findMeetingWithUserFromOffer = async ({offer}: {offer: Offer}): Promise<Meeting | null > => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: offer.meetingId },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    username: true,
                    email: true,
                }
            }
        }
    });
    return meeting;
}