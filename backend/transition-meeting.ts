import { ACCEPTED_MEETING_STATE, ACCEPTOR_ACTOR_ROLE, CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE, DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, FRIEND_SPECIFIC_TARGET_TYPE, INITIATOR_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE, OPEN_TARGET_TYPE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, SPECIFIC_TARGET_ACTOR_ROLE, SYSTEM_ACTOR_ROLE, type DomainEvent, type Meeting, type MeetingActorRole, type MeetingState } from "../types.js";
import { getMeetingById } from "./query/meeting-lookup.js";
import { updateMeetingState } from "./update/meeting-update.js";
import { isTimePast } from "./utils.js";


const idempotentStates = new Set([
        SEARCHING_MEETING_STATE,
        CANCELED_MEETING_STATE,
        EXPIRED_MEETING_STATE,
        PAST_MEETING_STATE,
    ]
);

const isTransitionActorAllowed = (meeting: Meeting, toState: MeetingState, actorId: string):boolean => {
    const meetingActorRole: MeetingActorRole = getMeetingActorRole({meeting, actorId});
    return allowedRolesForGoalState[toState].includes(meetingActorRole);
}

const isTransitionAllowed = (fromState: MeetingState, toState: MeetingState): boolean => {
    return allowedStateTransitions[fromState].includes(toState);
}
const isTimeValid = async (meeting: Meeting, toState: MeetingState): Promise<boolean> => {
    const timeIsPast = await isTimePast({eventTime: meeting.scheduledEnd});
    return timeIsPast ? (toState === PAST_MEETING_STATE) : (toState !== PAST_MEETING_STATE);
}

const allowedRolesForGoalState: Record<MeetingState, MeetingActorRole[]> = {
    DISMISSED_DRAFT: [INITIATOR_ACTOR_ROLE],
    DRAFT: [],
    SEARCHING: [INITIATOR_ACTOR_ROLE],
    ACCEPTED: [SPECIFIC_TARGET_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE],
    REJECTED: [SPECIFIC_TARGET_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE],
    EXPIRED: [SYSTEM_ACTOR_ROLE],
    CANCELED: [INITIATOR_ACTOR_ROLE, ACCEPTOR_ACTOR_ROLE, SYSTEM_ACTOR_ROLE],
    PAST: [SYSTEM_ACTOR_ROLE],
}

const allowedStateTransitions: Record<MeetingState, MeetingState[]> = {
    DISMISSED_DRAFT: [],
    DRAFT: [SEARCHING_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE],
    SEARCHING: [ACCEPTED_MEETING_STATE, REJECTED_MEETING_STATE, CANCELED_MEETING_STATE],
    ACCEPTED: [PAST_MEETING_STATE, CANCELED_MEETING_STATE],
    REJECTED: [PAST_MEETING_STATE],
    EXPIRED: [PAST_MEETING_STATE],
    CANCELED: [PAST_MEETING_STATE],
    PAST: [],
} 

const buildDomainEvents = ({fromState, toState, meeting}: {fromState: MeetingState, toState: MeetingState, meeting: Meeting} ) => {

}

const getMeetingActorRole = ({meeting, actorId}: {meeting: Meeting, actorId: string}): MeetingActorRole => {
    const meetingCreatorId = meeting?.userFromId;
    const meetingState = meeting.meetingState;
    if ([PAST_MEETING_STATE, EXPIRED_MEETING_STATE, REJECTED_MEETING_STATE].includes(meetingState)) {
        return SYSTEM_ACTOR_ROLE;
    }
    else if (actorId === meetingCreatorId && actorId !== meeting.acceptedUserId && actorId !== meeting.targetUserId) {
        return INITIATOR_ACTOR_ROLE;
    }
    else if (actorId === meeting.acceptedUserId) {
        return ACCEPTOR_ACTOR_ROLE;
    }
    else if (actorId === meeting.targetUserId) {
        return SPECIFIC_TARGET_ACTOR_ROLE;
    }
    else if (meeting.targetType === OPEN_TARGET_TYPE) {
        return OPEN_TARGET_ACTOR_ROLE;
    }
    throw new Error("This is user does not have a valid role for this meeting.")
}


export const transitionMeeting = async ({meetingId, toState, actorId}: {meetingId: string, toState: MeetingState, actorId: string}):
    Promise<{meeting: Meeting, events: DomainEvent[]}> => {
    const meeting = await getMeetingById({meetingId});

    if (!meeting) {
        throw new Error("Cannot find meeting.")
    }

    const meetingState = meeting.meetingState;

    if (meetingState === toState) {
        if (idempotentStates.has(meetingState)) {
            return {meeting, events: []}
        } else {
            throw new Error(`Incorrect redundant state transition: ${meetingState}`);
        }
    }
    const validStateTransition = isTransitionAllowed(meetingState, toState);
    if (!validStateTransition) {
        throw new Error(`Incorrect state transition from ${meetingState} to ${toState}`);
    }
    const transitionActorValid = isTransitionActorAllowed(meeting, toState, actorId);
    if (!transitionActorValid) {
        throw new Error(`Incorrect state transition from ${meetingState} to ${toState} for this user: ${actorId}`);
    }

    // const timeConstraintsValid = await isTimeValid(meeting, toState);
    // if (!timeConstraintsValid) {
    //     throw new Error(`Incorrect time status for transition from ${meetingState} to ${toState}.`);
    // }
    let acceptedUserId: string|null = null;

    if (toState === ACCEPTED_MEETING_STATE && [OPEN_TARGET_ACTOR_ROLE, SPECIFIC_TARGET_ACTOR_ROLE].includes(getMeetingActorRole({meeting, actorId}))) {
        acceptedUserId = actorId;
    }

    await updateMeetingState(meeting, toState, acceptedUserId);

    const updatedMeeting = await getMeetingById({meetingId})
    if (!updatedMeeting) {
        throw new Error(`Cannot fetch meeting after transition: ${meetingId}`);
    }
    return {meeting: updatedMeeting, events: []}
};


