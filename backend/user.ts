import type { RequestHandler } from 'express';
import { auth, prisma } from './auth.js'; 
import { fromNodeHeaders } from 'better-auth/node'; 

export const createUser = async ({ email, phoneNumber, name, password }) => {
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
}

export const findUserByPhone = async (phoneNumber) => {
    const user = await prisma.user.findUnique({
        where: { phoneNumber },
        });
        if (user) {
            console.log('User found:', user);
            return user;
        } else {
            console.log('User not found.');
            return null;
        }
};

export const updateUserPushToken = async ({ userId, pushToken }: { userId: string, pushToken: string }) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            pushToken: pushToken
        }
    });
    console.log("Updated user push token:", updatedUser);
    return updatedUser;
};

export const getUserPushToken = async ({ userId }: { userId: string }): Promise<string | null> => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            pushToken: true
        }
    });

    return user?.pushToken ?? null;
};