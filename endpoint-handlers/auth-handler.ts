import {auth} from '../backend/auth.js';
import type { Request, Response } from 'express';

import { fromNodeHeaders } from "better-auth/node";
import { createUser } from '../backend/user.js';
import { validateUsername } from '../backend/username-validation.js';

export const handleSignIn = async (req: Request, res: Response) => {
    console.log("sign in - ", req.body.email)
    try {
        const session = await auth.api.signInEmail({
            body: {
              email: req.body.email,
              password: req.body.password,
              rememberMe: true,
            },
            headers: fromNodeHeaders(req.headers),
          });

        return res.json(session);
    } catch (error) {
        console.error("Error in sign in:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleSignOut = async (req: Request, res: Response) => {
  console.log("sign out!!!", req.body);

  try {
    const result = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
    });

    console.log("sign out successful:", result);
    return res.json({
      success: true,
      message: "Signed out successfully"
    });
  } catch (error) {
    console.error("Error signing out:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage
    });
  }
}

export const handleMe = async (req: Request, res: Response) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
            });
        return res.json(session);
    } catch (error) {
        console.error("Error getting session:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleSignUpPhone = async (req: Request, res: Response) => {
    console.log("Sign Up Phone Endpoint", req.body);
    try {
        const { email, phoneNumber, name, password, username } = req.body;

        const validation = validateUsername(username);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const user = await createUser({ email, phoneNumber, name, password, username });
        console.log("user is", user)
        return res.json(user);
    } catch (error) {
        console.error("Error signing up:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

// export const handleSignInPhone = async (req: Request, res: Response) => {
//       // TODO - can I use this instead of the email one???
//     const session = await auth.api.signInPhoneNumber({
//         body: {
//           phoneNumber: req.body.phoneNumber,
//           password: req.body.password,
//           rememberMe: true,
//         },
//         headers: fromNodeHeaders(req.headers),
//       });
//     return res.json(session);
// };