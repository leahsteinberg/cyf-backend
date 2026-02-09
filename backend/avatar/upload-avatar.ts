import { getCloudinary } from './cloudinary-client.js';
import { CLOUDINARY_CONFIG } from '../config/cloudinary-config.js';

interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Uploads a base64 image to Cloudinary and returns the URL.
 * Uses the userId as the public_id so uploading again replaces the old avatar.
 */
export async function uploadAvatar({
    userId,
    imageBase64,
    mimeType,
}: {
    userId: string;
    imageBase64: string;
    mimeType: string;
}): Promise<UploadResult> {
    const cloudinary = getCloudinary();

    // Build the data URI from base64
    const dataUri = `data:${mimeType};base64,${imageBase64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: CLOUDINARY_CONFIG.folder,
        public_id: userId,
        overwrite: true,
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
}

/**
 * Generates an optimized avatar URL for a given userId.
 * Returns null if no avatar exists.
 */
export function getAvatarUrl(userId: string): string {
    const cloudinary = getCloudinary();

    return cloudinary.url(`${CLOUDINARY_CONFIG.folder}/${userId}`, {
        transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
        secure: true,
    });
}

/**
 * Deletes an avatar from Cloudinary.
 */
export async function deleteAvatar(userId: string): Promise<void> {
    const cloudinary = getCloudinary();

    await cloudinary.uploader.destroy(`${CLOUDINARY_CONFIG.folder}/${userId}`);
}
