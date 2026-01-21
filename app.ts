import {auth } from './backend/auth.js';  
import express from 'express';
import { toNodeHandler } from "better-auth/node"; 
import cors from 'cors';
import { handleMe, handleSignIn, handleSignUpPhone, handleSignOut } from './endpoint-handlers/auth-handler.js';
import { handleCreateInvite, handleInviteSignUp, handleGetSentInvites, handleGetFriendInvites, handleAcceptInvite } from './endpoint-handlers/invite-handler.js';
import { handleGetUserByPhone } from './endpoint-handlers/user-handler.js';
import { handleGetFriends } from './endpoint-handlers/friend-handler.js';
import { handleCreateMeeting, handleGetMeetings, handleCancelMeeting } from './endpoint-handlers/meeting-handler.js';
import { handleGetOffers, handleAcceptOffer, handleRejectOffer } from './endpoint-handlers/offer-handler.js';
import { handleCronRound } from './endpoint-handlers/cron-handler.js';
import { handlePush } from './endpoint-handlers/push-handler.js';
import { handleBroadcastNow, handleBroadcastEnd, handleIsUserBroadcasting } from './endpoint-handlers/broadcast-handler.js';
import { handleCallStart, handleCallEnd, handleCallError } from './endpoint-handlers/call-handler.js';
import { handleAcceptSuggestion, handleCreateSampleSuggestion, handleCreateSuggestion, handleDismissSuggestion } from './endpoint-handlers/suggestion-handler.js';
import { handleAddUserSignal, handleGetUserSignals, handleRemoveUserSignal } from './endpoint-handlers/user-signal-handler.js';

const app = express();
const port = 3000;
const hostname = '192.168.0.30';
app.use(cors({
  origin: ['https://call-your-friends.expo.app', 'http://localhost:8081']
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

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


// INVITE ENDPOINTS
app.post('/api/create-invite', handleCreateInvite);
app.post('/api/sign-up-accept-invite', handleInviteSignUp);
app.post('/api/accept-invite', handleAcceptInvite);
app.post('/api/get-sent-invites', handleGetSentInvites);
app.post('/api/get-friend-invites', handleGetFriendInvites);
// TODO *** app.post('/api/sign-in-accept-invite, ()=>{})


// FRIEND ENDPOINTS
app.post('/api/get-friends', handleGetFriends);


//MEETING ENDPOINTS
app.post('/api/create-meeting', handleCreateMeeting);
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

app.get('/api/simulate-cron-round', handleCronRound)


app.get('/', (req, res) => {
  console.log("client IP address", req.ip)
  res.send('{"message": "Hello World! from port 3000!"}');// TODO - switch to res.json()?
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

