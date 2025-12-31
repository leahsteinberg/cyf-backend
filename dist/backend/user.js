import { auth } from './auth.js';
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
export const signOutUser = async (req) => { };
//# sourceMappingURL=user.js.map