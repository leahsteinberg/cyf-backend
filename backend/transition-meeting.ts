import { ACCEPTED_MEETING_STATE, ACCEPTOR_ACTOR_ROLE, CANCELED_MEETING_STATE, DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, INITIATOR_ACTOR_ROLE, OPEN_TARGET_ACTOR_ROLE, OPEN_TARGET_TYPE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, SPECIFIC_TARGET_ACTOR_ROLE, type Meeting, type MeetingState } from "../types.js";
import { getMeetingById } from "./query/meeting-lookup.js";


const meetingActorStatus = ({meeting, actorId}: {meeting: Meeting, actorId: string}): string {
    const meetingCreatorId = meeting?.userFromId;
    if (actorId === meetingCreatorId && actorId !== meeting.acceptedUserId && actorId !== meeting.targetUserId) {
        return INITIATOR_ACTOR_ROLE;
    }
    if (actorId === meeting.acceptedUserId) {
        return ACCEPTOR_ACTOR_ROLE;
    }
    if (actorId === meeting.targetUserId) {
        return SPECIFIC_TARGET_ACTOR_ROLE;
    }
    if (meeting.targetType === OPEN_TARGET_TYPE) {
        return OPEN_TARGET_ACTOR_ROLE;
    }
    throw new Error("This is user does not have a valid role for this meeting.")
}


export const transitionMeeting = async ({meetingId, toState, actorId}: {meetingId: string, toState: string, actorId: MeetingState}) => {
    const meeting = await getMeetingById({meetingId});

    if (!meeting) {
        throw new Error("Cannot find meeting.")
    }

    const meetingState = meeting?.meetingState;

    if (meetingState === DRAFT_MEETING_STATE) {
        if (meetingActorStatus({meeting, actorId}) === INITIATOR_ACTOR_ROLE) {
            // valid transition
        }
    } else if (meetingState === SEARCHING_MEETING_STATE) {

    } else if (meetingState === ACCEPTED_MEETING_STATE) {

    } else if (meetingState === REJECTED_MEETING_STATE) {
        
    } else if (meetingState === EXPIRED_MEETING_STATE) {

    } else if (meetingState === CANCELED_MEETING_STATE) {
        
    }




};