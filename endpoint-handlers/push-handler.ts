import { updateUserPushToken } from "../backend/update/user-update.js";
import { sendPushNotification, isValidExpoPushToken } from "../backend/push-notifications.js";
import type { Request, Response } from 'express';

export const handlePush = async (req: Request, res: Response) => {
    const { pushToken, userId, timezone } = req.body;
    console.log("register push --", { pushToken, userId, timezone });

    if (!pushToken || !userId) {
        return res.status(400).json({ error: "pushToken and userId are required" });
    }

    // Validate the push token format
    if (!isValidExpoPushToken(pushToken)) {
        return res.status(400).json({ error: "Invalid Expo push token format" });
    }

    try {
        // Save the push token and timezone to the database
        const updatedUser = await updateUserPushToken({ userId, pushToken, timezone });

        // No longer send a test "Hello World" notification (annoying to users)
        // const notification = await sendPushNotification({
        //     pushToken,
        //     title: "Welcome to Call Your Friends! 🎉",
        //     body: "Push notifications are now enabled. You'll receive updates about your meetings here!",
        //     data: { type: "test", userId }
        // });

        // console.log("Test notification sent:", notification);

        res.json({
            success: true,
            user: updatedUser,
            //notification: notification
        });
    } catch (error) {
        console.error("Error in push registration:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
}