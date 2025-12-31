export declare const findInvite: (token: string, userToPhoneNumber: string) => Promise<({
    userFrom: {
        phoneNumber: string | null;
        email: string;
        username: string | null;
        id: string;
        name: string | null;
        displayUsername: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
}) | null>;
export declare const getSentInvites: ({ userFromId }: {
    userFromId: string;
}) => Promise<({
    userFrom: {
        phoneNumber: string | null;
        email: string;
        username: string | null;
        id: string;
        name: string | null;
        displayUsername: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
})[]>;
export declare const getFriendInvites: ({ userToPhoneNumber }: {
    userToPhoneNumber: string;
}) => Promise<({
    userFrom: {
        phoneNumber: string | null;
        name: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
})[]>;
//# sourceMappingURL=invite-lookup.d.ts.map