
export type OfferState = "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type MeetingState = "SEARCHING" | "ACCEPTED" | "REJECTED" | "PAST";

export interface BaseEntity {
    id: string;
};

export interface User extends BaseEntity {
    name: string | null;
    email: string;
    username: string | null;
    displayUsername: string | null;
}

export interface Meeting extends BaseEntity {
    userFromId: string;
    scheduledFor: Date;
    acceptedUserId: string | null;
    meetingState: MeetingState;
    userFrom: User;
}

export interface Offer extends BaseEntity {
    meetingId: string;
    userOfferedId: string;
    createdAt: Date;
    offerState: OfferState;
}