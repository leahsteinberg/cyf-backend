export const CLOUDINARY_CONFIG = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: 'cyf-avatars',
    meetingPhotosFolder: 'cyf-meeting-photos',
};
