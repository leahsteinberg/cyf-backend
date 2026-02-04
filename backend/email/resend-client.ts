import { Resend } from 'resend';
import { EMAIL_CONFIG } from '../config/email-config.js';

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
    if (!resendClient) {
        if (!EMAIL_CONFIG.apiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }
        resendClient = new Resend(EMAIL_CONFIG.apiKey);
    }
    return resendClient;
}
