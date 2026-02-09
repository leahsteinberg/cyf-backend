import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CONFIG } from '../config/cloudinary-config.js';

let configured = false;

export function getCloudinary() {
    if (!configured) {
        if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.apiKey || !CLOUDINARY_CONFIG.apiSecret) {
            throw new Error('Cloudinary credentials not configured');
        }
        cloudinary.config({
            cloud_name: CLOUDINARY_CONFIG.cloudName,
            api_key: CLOUDINARY_CONFIG.apiKey,
            api_secret: CLOUDINARY_CONFIG.apiSecret,
        });
        configured = true;
    }
    return cloudinary;
}
