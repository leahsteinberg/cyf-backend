import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma/client.js";
import { phoneNumber } from "better-auth/plugins"
import { username } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins"
import { sendOTPEmail } from "./email/send-email.js"

export const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
        emailAndPassword: {
        enabled: true,
    },
    plugins: [ 
        phoneNumber({  
            sendOTP: ({ phoneNumber, code }, request) => {} 
        }),
        username(),
        emailOTP({
            sendVerificationOTP: async ({ email, otp, type }) => {
                await sendOTPEmail({ email, otp, type });
            },
        }),
    ] 
});
