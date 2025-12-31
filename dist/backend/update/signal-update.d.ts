import { type SignalPayloadMap, type SignalType, type UserSignal } from "../../types.js";
export declare const addSignalForUser: <T extends SignalType>({ userId, signalType, payload }: {
    userId: string;
    signalType: T;
    payload: SignalPayloadMap[T];
}) => Promise<UserSignal<SignalType>[]>;
export declare const removeSignalForUser: ({ userId, signalId }: {
    userId: string;
    signalId: string;
}) => Promise<UserSignal<SignalType> | null>;
//# sourceMappingURL=signal-update.d.ts.map