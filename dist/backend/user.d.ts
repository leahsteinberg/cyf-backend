export declare const createUser: ({ email, phoneNumber, name, password }: {
    email: any;
    phoneNumber: any;
    name: any;
    password: any;
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
export declare const signOutUser: (req: any) => Promise<void>;
export declare const findUserByPhone: (phoneNumber: any) => Promise<{
    phoneNumber: string | null;
    email: string;
    phoneNumberVerified: boolean | null;
    username: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    emailVerified: boolean;
    name: string | null;
    image: string | null;
    displayUsername: string | null;
} | null>;
//# sourceMappingURL=user.d.ts.map