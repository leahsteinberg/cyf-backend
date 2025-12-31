import type { Meeting, Offer, User } from "../../types.js";
export declare const findMeetingWithUserFromOffer: ({ offer }: {
    offer: Offer;
}) => Promise<Meeting | null>;
export declare const getCreatedMeetings: ({ userFromId }: {
    userFromId: string;
}) => Promise<Meeting[]>;
export declare const getAcceptedMeetings: ({ acceptedUserId }: {
    acceptedUserId: string;
}) => Promise<Meeting[]>;
export declare const getAllSearchingMeetings: () => Promise<Meeting[]>;
export declare const getUserFromMeeting: (meeting: Meeting) => Promise<User | null>;
export declare const getMeetingById: ({ meetingId }: {
    meetingId: string;
}) => Promise<Meeting | null>;
export declare const getUserFromMeetingId: (meetingId: string) => Promise<User | null>;
/**
 * Enriches meetings with acceptedUsers array containing full User objects
 * for all users in acceptedUserIds
 */
export declare const enrichMeetingsWithAcceptedUsers: (meetings: Meeting[]) => Promise<Meeting[]>;
//# sourceMappingURL=meeting-lookup.d.ts.map