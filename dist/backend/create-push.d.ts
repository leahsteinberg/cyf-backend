import type { Offer } from "../types.js";
/**
 * Creates and sends a push notification for a new offer
 * @param offer - The offer object
 */
export declare const createAndSendOfferPush: ({ offer }: {
    offer: Offer;
}) => Promise<import("expo-server-sdk").ExpoPushTicket | undefined>;
//# sourceMappingURL=create-push.d.ts.map