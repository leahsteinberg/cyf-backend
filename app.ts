import {auth } from './backend/auth.js';
import express from 'express';
import { toNodeHandler } from "better-auth/node";
import cors from 'cors';
import { handleMe, handleSignIn, handleSignUpPhone, handleSignOut } from './endpoint-handlers/auth-handler.js';
import { handleCreateInvite, handleInviteSignUp, handleGetSentInvites, handleGetFriendInvites, handleAcceptInvite, handleRemoveInvite } from './endpoint-handlers/invite-handler.js';
import { handleGetUserByPhone, handleGetProfile, handleDeleteUser } from './endpoint-handlers/user-handler.js';
import { handleGetFriends, handleSearchUsers, handleSendFriendRequest } from './endpoint-handlers/friend-handler.js';
import { handleCreateMeeting, handleGetMeetings, handleCancelMeeting } from './endpoint-handlers/meeting-handler.js';
import { handleCreateSmartMeeting } from './endpoint-handlers/smart-meeting-handler.js';
import { handleGetOffers, handleAcceptOffer, handleRejectOffer } from './endpoint-handlers/offer-handler.js';
import { handleCronRound } from './endpoint-handlers/cron-handler.js';
import { handlePush } from './endpoint-handlers/push-handler.js';
import { handleBroadcastNow, handleBroadcastEnd, handleIsUserBroadcasting } from './endpoint-handlers/broadcast-handler.js';
import { handleCallStart, handleCallEnd, handleCallError } from './endpoint-handlers/call-handler.js';
import { handleAcceptSuggestion, handleCreateSampleSuggestion, handleCreateSuggestion, handleDismissSuggestion } from './endpoint-handlers/suggestion-handler.js';
import { handleAddUserSignal, handleGetUserSignals, handleRemoveUserSignal } from './endpoint-handlers/user-signal-handler.js';
import { handleGenerateSuggestions } from './endpoint-handlers/ai-suggestion-handler.js';
import { handleSuggestNewTime } from './endpoint-handlers/suggest-new-time-handler.js';
import { handleUploadAvatar, handleGetAvatar } from './endpoint-handlers/avatar-handler.js';
import { handleUploadMeetingPhoto, handleDeleteMeetingPhoto, handleUpdateMeetingMeta } from './endpoint-handlers/meeting-content-handler.js';
import { handleCreateGroup, handleGetGroups, handleAddGroupMember, handleRemoveGroupMember, handleDeleteGroup } from './endpoint-handlers/group-handler.js';

// Import event system to register handlers (side effect import)
import './backend/events/index.js';

const app = express();
const port = 3000;
const hostname = '192.168.0.30';
app.use(cors({
  origin: ['https://call-your-friends.expo.app', 'http://localhost:8081']
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: '10mb' }));

// SAMPLE ENDPOINTS
app.post("/api/register-push", handlePush);

//cron.schedule('* * * * *', handleCronRound);

// AUTH ENDPOINTS
app.get("/api/me", handleMe);
app.post("/api/signup-phone", handleSignUpPhone);
app.post("/api/signInEmail", handleSignIn);
// app.post("/api/signInPhone", handleSignInPhone);
app.post('/api/signout', handleSignOut)


// USER ENDPOINTS
app.post('/api/user-by-phone', handleGetUserByPhone);
app.post('/api/get-profile', handleGetProfile);
app.delete('/api/user', handleDeleteUser);


// INVITE ENDPOINTS
app.post('/api/create-invite', handleCreateInvite);
app.post('/api/sign-up-accept-invite', handleInviteSignUp);
app.post('/api/accept-invite', handleAcceptInvite);
app.post('/api/get-sent-invites', handleGetSentInvites);
app.post('/api/get-friend-invites', handleGetFriendInvites);
app.post('/api/remove-invite', handleRemoveInvite);
// TODO *** app.post('/api/sign-in-accept-invite, ()=>{})


// FRIEND ENDPOINTS
app.post('/api/get-friends', handleGetFriends);
app.post('/api/search-users', handleSearchUsers);
app.post('/api/send-friend-request', handleSendFriendRequest);

// GROUP ENDPOINTS
app.post('/api/create-group', handleCreateGroup);
app.post('/api/get-groups', handleGetGroups);
app.post('/api/add-group-member', handleAddGroupMember);
app.post('/api/remove-group-member', handleRemoveGroupMember);
app.post('/api/delete-group', handleDeleteGroup);


//MEETING ENDPOINTS
app.post('/api/create-meeting', handleCreateMeeting);
app.post('/api/create-smart-meeting', handleCreateSmartMeeting);
app.post('/api/get-meetings', handleGetMeetings);
app.post('/api/cancel-meeting', handleCancelMeeting);

//OFFER ENDPOINTS
app.post('/api/get-offers', handleGetOffers);
app.post('/api/accept-offer', handleAcceptOffer);
app.post('/api/reject-offer', handleRejectOffer);

//BROADCAST ENDPOINTS
app.post('/api/broadcast-now', handleBroadcastNow);
app.post('/api/broadcast-end', handleBroadcastEnd);
app.post('/api/is-user-broadcasting', handleIsUserBroadcasting);

//CALL TRACKING ENDPOINTS
app.post('/api/calls/start', handleCallStart);
app.post('/api/calls/end', handleCallEnd);
app.post('/api/calls/error', handleCallError);

//USER SIGNAL ENDPOINTS
app.post('/api/get-user-signals', handleGetUserSignals);
app.post('/api/add-user-signal', handleAddUserSignal);
app.post('/api/remove-user-signal', handleRemoveUserSignal);

//SUGGESTION ENDPOINTS
app.post('/api/accept-suggestion', handleAcceptSuggestion);
app.post('/api/dismiss-suggestion', handleDismissSuggestion);
app.post('/api/create-suggestion', handleCreateSuggestion);
app.get('/api/create-sample-suggestion', handleCreateSampleSuggestion);
app.get('/api/generate-suggestions', handleGenerateSuggestions);
app.post('/api/suggest-new-time', handleSuggestNewTime);

app.get('/api/simulate-cron-round', handleCronRound)

//AVATAR ENDPOINTS
app.post('/api/upload-avatar', handleUploadAvatar);
app.post('/api/get-avatar', handleGetAvatar);

//MEETING CONTENT ENDPOINTS
app.post('/api/upload-meeting-photo', handleUploadMeetingPhoto);
app.post('/api/delete-meeting-photo', handleDeleteMeetingPhoto);
app.post('/api/update-meeting-meta', handleUpdateMeetingMeta);

app.get('/', (req, res) => {
  console.log("client IP address", req.ip)
  res.send('{"message": "Hello World! from port 3000!"}');// TODO - switch to res.json()?
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

