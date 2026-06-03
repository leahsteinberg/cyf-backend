import type { RequestHandler } from 'express';
import { auth, prisma } from './auth.js';
import { toDisplayUsername } from './username-validation.js';

export const createUser = async ({
  email,
  phoneNumber,
  name,
  password,
  username,
}: {
  email: string;
  phoneNumber: string;
  name: string;
  password: string;
  username: string;
}) => {
  const user = await auth.api.signUpEmail({
    body: {
      email,
      phoneNumber,
      name,
      password,
      username,
    },
  });

  // displayUsername is a custom field not managed by better-auth, set it directly
  await prisma.user.update({
    where: { id: user.user.id },
    data: { displayUsername: toDisplayUsername(username) },
  });

  return user;
};


export const signOutUser: RequestHandler = async (req) => {};
