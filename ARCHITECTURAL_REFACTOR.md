

| Suggestion Type                             | TimeType  | TargetType      | MeetingState Start | Notes                                                                                             |
| ------------------------------------------- | --------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| Type 1: User → Time known, Friend unknown   | FUTURE    | OPEN            | DRAFT              | Accept → SEARCHING → ACCEPTED                                                                     |
| Type 2: User → Friend known, Time unknown   | UNKNOWN   | FRIEND_SPECIFIC | DRAFT              | Accept → SEARCHING → ACCEPTED                                                                     |
| Type 3: System → Time known, Friend unknown | FUTURE    | OPEN            | DRAFT              | Accept → SEARCHING → ACCEPTED                                                                     |
| Type 4: System → Friend known, Time unknown | UNKNOWN   | FRIEND_SPECIFIC | DRAFT              | Accept → SEARCHING → ACCEPTED                                                                     |
| Type 5: System → Time known, Friend known   | IMMEDIATE | FRIEND_SPECIFIC | SEARCHING          | Friend claims → ACCEPTED                                                                          |
| Broadcast Now    *existing feature*         | IMMEDIATE | OPEN            | SEARCHING          | First friend to claim → ACCEPTED; optional BroadcastMetadata handles lock / two-step confirmation |





| Axis                       | Options                                         | Meaning / Use Case                                                                              |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **MeetingState**           | DRAFT → SEARCHING → ACCEPTED → PAST / EXPIRED   | Lifecycle of the meeting. **CLAIMED is merged into ACCEPTED**.                                  |
| **TimeType**               | FUTURE / IMMEDIATE / UNKNOWN                    | Describes whether the call is scheduled for later, happening now, or yet to be determined.      |
| **TargetType**             | OPEN / FRIEND_SPECIFIC / GROUP                  | Who the meeting is intended for: open to multiple friends, specific friend, or a defined group. |
| **SourceType (optional)**  | USER_INTENT / SYSTEM_PATTERN / SYSTEM_REAL_TIME | Helps track who triggered the suggestion.                                                       |
| **IntentLabel (optional)** | “catch_up”, “quick_hi”, etc.                    | Semantic label for UX / analytics.                                                              |




Schema changes - 

enum TimeType {
  IMMEDIATE
  FUTURE
  UNKNOWN
}

enum TargetType {
  OPEN        // Friend unknown
  FRIEND_SPECIFIC
  GROUP
}


enum MeetingState {
    DRAFT
    SEARCHING
    CLAIMED (will deal with this later, for now, ignore)
    ACCEPTED
    REJECTED
    PAST
}

SourceType (optional)
USER_INTENT / SYSTEM_PATTERN / SYSTEM_REAL_TIME



