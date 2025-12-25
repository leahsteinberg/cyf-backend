import type { Meeting, Offer, User } from "../../types.js";
import { SEARCHING_MEETING_STATE } from "../../types.js";
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
            },
            acceptedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            },
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return meeting;
}

export const getCreatedMeetings = async ({userFromId}: {userFromId: string}): Promise<Meeting[]> => {
    const meetings = await prisma.meeting.findMany({
        where: {
            userFromId
        },
        include: {
            acceptedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                },
            },
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    return meetings;
};


export const getAcceptedMeetings = async ({acceptedUserId}: {acceptedUserId: string}): Promise<Meeting[]> => {
    const meetings = await prisma.meeting.findMany({
        where: {
            acceptedUserIds: {
                has: acceptedUserId
            }
        },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                },
            },
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    return meetings;
};


export const getAllSearchingMeetings = async (): Promise<Meeting[]> => {
    const meetings = await prisma.meeting.findMany({
        where: {
            meetingState: SEARCHING_MEETING_STATE,
        },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            },
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            },
        }
    });
    return meetings;
}

export const getUserFromMeeting = async (meeting: Meeting): Promise<User | null> => {
    const id = meeting.userFromId;
    const user = await prisma.user.findFirst({
        where: {
            id
        }
    });
    return user;
};

export const getMeetingById = async ({meetingId}: {meetingId: string}): Promise<Meeting | null> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            },
            acceptedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            },
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return meeting;
};

export const getUserFromMeetingId = async (meetingId: string): Promise<User | null> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
            userFrom: true,
            broadcastMetadata: {
                include: {
                    offerClaimed: {
                        include: {
                            userOffered: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    username: true,
                                    displayUsername: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return meeting?.userFrom ?? null;
};

/**
 * Enriches meetings with acceptedUsers array containing full User objects
 * for all users in acceptedUserIds
 */
export const enrichMeetingsWithAcceptedUsers = async (meetings: Meeting[]): Promise<Meeting[]> => {
    // Collect all unique acceptedUserIds across all meetings
    const allAcceptedUserIds = new Set<string>();
    meetings.forEach(meeting => {
        meeting.acceptedUserIds.forEach(userId => allAcceptedUserIds.add(userId));
    });

    if (allAcceptedUserIds.size === 0) {
        // No accepted users to fetch, return meetings as-is with empty acceptedUsers arrays
        return meetings.map(m => ({ ...m, acceptedUsers: [] }));
    }

    // Fetch all accepted users in a single query
    const acceptedUsers = await prisma.user.findMany({
        where: {
            id: { in: Array.from(allAcceptedUserIds) }
        },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true
        }
    });

    // Create a map for quick lookup
    const userMap = new Map(acceptedUsers.map(user => [user.id, user]));

    // Enrich each meeting with its acceptedUsers array
    return meetings.map(meeting => ({
        ...meeting,
        acceptedUsers: meeting.acceptedUserIds
            .map(userId => userMap.get(userId))
            .filter((user): user is NonNullable<typeof user> => user !== undefined)
    }));
};
