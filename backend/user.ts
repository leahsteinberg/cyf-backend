import { auth, prisma } from './auth.ts';  

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