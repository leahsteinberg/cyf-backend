import { getResendClient } from './resend-client.js';
import { EMAIL_CONFIG } from '../config/email-config.js';

type OTPType = 'sign-in' | 'email-verification' | 'forget-password';

export async function sendOTPEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: OTPType;
}): Promise<void> {
    const resend = getResendClient();
    const { subject, body } = getEmailContent(otp, type);

    const { error } = await resend.emails.send({
        from: EMAIL_CONFIG.fromEmail,
        to: email,
        subject,
        html: body,
    });

    if (error) {
        console.error(`Failed to send ${type} OTP email to ${email}:`, error);
        throw new Error(`Failed to send OTP email: ${error.message}`);
    }

    console.log(`Sent ${type} OTP email to ${email}`);
}

function getEmailContent(
    otp: string,
    type: OTPType,
): { subject: string; body: string } {
    const appName = EMAIL_CONFIG.appName;

    switch (type) {
        case 'forget-password':
            return {
                subject: `${appName} - Reset Your Password`,
                body: buildOTPEmailHTML({
                    heading: 'Reset Your Password',
                    message: 'You requested a password reset. Use the code below to set a new password.',
                    otp,
                }),
            };

        case 'email-verification':
            return {
                subject: `${appName} - Verify Your Email`,
                body: buildOTPEmailHTML({
                    heading: 'Verify Your Email',
                    message: 'Use the code below to verify your email address.',
                    otp,
                }),
            };

        case 'sign-in':
            return {
                subject: `${appName} - Sign In Code`,
                body: buildOTPEmailHTML({
                    heading: 'Sign In Code',
                    message: 'Use the code below to sign in to your account.',
                    otp,
                }),
            };
    }
}

function buildOTPEmailHTML({
    heading,
    message,
    otp,
}: {
    heading: string;
    message: string;
    otp: string;
}): string {
    return `
<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">${heading}</h2>
    <p style="color: #555;">${message}</p>
    <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 14px;">
        This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.
    </p>
</div>`.trim();
}
