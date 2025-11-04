import { auth, prisma } from './auth.ts'; 
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


export const signOutUser = async(req) => {
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