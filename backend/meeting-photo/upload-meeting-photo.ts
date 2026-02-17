import { getCloudinary } from '../avatar/cloudinary-client.js';
import { CLOUDINARY_CONFIG } from '../config/cloudinary-config.js';

interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Uploads a base64 image to Cloudinary for a meeting.
 * Uses the meetingId as the public_id so uploading again replaces the old photo.
 */
export async function uploadMeetingPhoto({
    meetingId,
    imageBase64,
    mimeType,
}: {
    meetingId: string;
    imageBase64: string;
    mimeType: string;
}): Promise<UploadResult> {
    const cloudinary = getCloudinary();

    const dataUri = `data:${mimeType};base64,${imageBase64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: CLOUDINARY_CONFIG.meetingPhotosFolder,
        public_id: meetingId,
        overwrite: true,
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
}

/**
 * Deletes a meeting photo from Cloudinary.
 */
export async function deleteMeetingPhoto(meetingId: string): Promise<void> {
    const cloudinary = getCloudinary();

    await cloudinary.uploader.destroy(`${CLOUDINARY_CONFIG.meetingPhotosFolder}/${meetingId}`);
}
