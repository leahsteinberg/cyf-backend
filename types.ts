enum MeetingState {
    Searching = "SEARCHING",
    Accepted = "ACCEPTED",
    Rejected = "REJECTED",
    Past = "PAST"
}

enum OfferState {
    Open = "OPEN",
    Accepted = "ACCEPTED",
    Rejected = "REJECTED",
    Expired = "EXPIRED",
}

interface BaseEntity {
    id: string;
};

interface User extends BaseEntity {
    name: string;
    email: string;
}

interface Meeting extends BaseEntity {
    userFromId: string;
    scheduledFor: string;
    acceptedUserId?: string;
    meetingState: MeetingState
}

interface Offer extends BaseEntity {
    meetingId: string;
    userOfferedId: string;
    createdAt: string;
    offerState: OfferState;
}