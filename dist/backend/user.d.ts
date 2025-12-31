import type { RequestHandler } from 'express';
export declare const createUser: ({ email, phoneNumber, name, password }: {
    email: string;
    phoneNumber: string;
    name: string;
    password: string;
}) => Promise<{
    token: null;
    user: {
        id: string;
        email: string;
        name: string;
        image: string | null | undefined;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
} | {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        image: string | null | undefined;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare const signOutUser: RequestHandler;
//# sourceMappingURL=user.d.ts.map