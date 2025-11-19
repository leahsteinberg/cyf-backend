import type { RequestHandler } from 'express';
import { auth } from './auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const createUser = async ({ email, phoneNumber, name, password }: { email: string, phoneNumber: string, name: string, password: string }) => {
    const user = await auth.api.signUpEmail({
        body: {
            email,
            phoneNumber,
            name,
            password,
        },
    });
    return user;
};


export const signOutUser: RequestHandler = async (req) => {
    // console.log("user id d---- ", userId);
    // const user = await auth.api.signOut({
    //     headers: fromNodeHeaders(req.headers),

    // })
    // console.log("sign out --- ", user);
    // return user;
};