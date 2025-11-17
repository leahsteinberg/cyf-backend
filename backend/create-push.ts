import type { Offer } from "../types.js";
import { sendPushNotification } from "./push-notifications.js";
import { getUserPushToken } from "./user.js";

export const createAndSendOfferPush = async (offer: Offer) => {
    const userId = offer.userOfferedId;
    const pushToken = await getUserPushToken({userId});
    if (pushToken) {
        const notification = await sendPushNotification({
            pushToken,
            title: "Your Offer is here!!!",
            body: "Want to talk to this person at this time?",
            data: { type: "test", userId }
        });
    }

}