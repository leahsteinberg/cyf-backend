export declare const createInvite: ({ userFromId, userToPhoneNumber }: {
    userFromId: string;
    userToPhoneNumber: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
}>;
export declare const deleteInvite: ({ inviteId }: {
    inviteId: string;
}) => Promise<{
    id: string;
    createdAt: Date;
    token: string;
    userFromId: string;
    userToPhoneNumber: string;
    accepted: boolean;
}>;
//# sourceMappingURL=invite-update.d.ts.map