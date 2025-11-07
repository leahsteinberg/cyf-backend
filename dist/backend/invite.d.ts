export declare const createInvite: ({ userFromId, userToPhoneNumber }: {
    userFromId: any;
    userToPhoneNumber: any;
}) => Promise<{
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
}>;
export declare const removeCompletedInvite: () => Promise<void>;
export declare const findInvite: (token: any, userToPhoneNumber: any) => Promise<{
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
} | null>;
export declare const getSentInvites: ({ userFromId }: {
    userFromId: any;
}) => Promise<{
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
}[]>;
export declare const getIncomingInvites: () => Promise<void>;
//# sourceMappingURL=invite.d.ts.map