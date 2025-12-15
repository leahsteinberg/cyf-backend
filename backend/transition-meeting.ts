import { ACCEPTED_MEETING_STATE, ACCEPTOR_ACTOR_ROLE, CANCELED_MEETING_STATE, DISMISSED_SUGGESTION_MEETING_STATE, DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, FRIEND_SPECIFIC_TARGET_TYPE, INITIATOR_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE, OPEN_TARGET_TYPE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, SPECIFIC_TARGET_ACTOR_ROLE, type DomainEvent, type Meeting, type MeetingActorRole, type MeetingState } from "../types.js";
import { getMeetingById } from "./query/meeting-lookup.js";


const idempotentStates = new Set([
        SEARCHING_MEETING_STATE,
        CANCELED_MEETING_STATE,
        EXPIRED_MEETING_STATE,
        PAST_MEETING_STATE,
    ]
);


const buildDomainEvents = ({fromState, toState, meeting}: {fromState: MeetingState, toState: MeetingState, meeting: Meeting} ) => {

}

const getMeetingActorRole = ({meeting, actorId}: {meeting: Meeting, actorId: string}): MeetingActorRole => {
    const meetingCreatorId = meeting?.userFromId;
    if (meeting.meetingState === PAST_MEETING_STATE
        || meeting.meetingState === EXPIRED_MEETING_STATE || meeting.meetingState === ) {

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
    const transitionActorValid = isTransitionActorAllowed(meeting, toState, actorId)

};

const isTransitionActorAllowed = (meeting: Meeting, toState: MeetingState, actorId: string):boolean => {
    const meetingActorRole: MeetingActorRole = getMeetingActorRole({meeting, actorId});

}

const allowedRolesForGoalState: Record<MeetingState, MeetingActorRole[]> = {
    DISMISSED_SUGGESTION: [INITIATOR_ACTOR_ROLE],
    DRAFT: [],
    SEARCHING: [INITIATOR_ACTOR_ROLE],
    ACCEPTED: [SPECIFIC_TARGET_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE],
    REJECTED: [SPECIFIC_TARGET_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE],
    EXPIRED: [],
    CANCELED: [],
    PAST: [],
}

const allowedStateTransitions: Record<MeetingState, MeetingState[]> = {
    DISMISSED_SUGGESTION: [],
    DRAFT: [SEARCHING_MEETING_STATE, DISMISSED_SUGGESTION_MEETING_STATE],
    SEARCHING: [ACCEPTED_MEETING_STATE, REJECTED_MEETING_STATE, CANCELED_MEETING_STATE],
    ACCEPTED: [PAST_MEETING_STATE, CANCELED_MEETING_STATE],
    REJECTED: [PAST_MEETING_STATE],
    EXPIRED: [PAST_MEETING_STATE],
    CANCELED: [PAST_MEETING_STATE],
    PAST: [],
} 

const isTransitionAllowed = (fromState: MeetingState, toState: MeetingState): boolean => {
    return allowedStateTransitions[fromState].includes(toState);
}
