import {auth, prisma} from './backend/auth.js';  
import express from 'express';
import { toNodeHandler } from "better-auth/node"; 
import cors from 'cors';
import { handleMe, handleSignIn, handleSignUpPhone, handleSignOut } from './endpoint-handlers/auth-handler.js';
import { handleCreateInvite, handleInviteSignUp, handleGetSentInvites, handleGetFriendInvites, handleAcceptInvite } from './endpoint-handlers/invite-handler.js';
import { handleGetUserByPhone } from './endpoint-handlers/user-handler.js';
import { handleGetFriends } from './endpoint-handlers/friend-handler.js';
import { handleCreateMeeting, handleGetMeetings, handleDeleteMeeting, handleCancelMeeting } from './endpoint-handlers/meeting-handler.js';
import { handleGetOffers, handleAcceptOffer, handleRejectOffer } from './endpoint-handlers/offer-handler.js';
import { handleCronRound } from './endpoint-handlers/cron-handler.js';
import cron from 'node-cron';
import { handlePush } from './endpoint-handlers/push-handler.js';
import { handleBroadcastNow, handleBroadcastEnd, handleTryAcceptBroadcast, handleAcceptBroadcast, handleRejectBroadcast, handleIsUserBroadcasting, handleCancelBroadcastAcceptance } from './endpoint-handlers/broadcast-handler.js';
import { handleCallIntent, handleUndoCallIntent } from './endpoint-handlers/call-intent-handler.js';
import { handleAcceptSuggestion, handleDismissSuggestion } from './endpoint-handlers/suggestion-handler.js';

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
app.post('/api/delete-meeting', handleDeleteMeeting);// TO BE DEPRECATED
app.post('/api/cancel-meeting', handleCancelMeeting);


//OFFER ENDPOINTS
app.post('/api/get-offers', handleGetOffers);
app.post('/api/accept-offer', handleAcceptOffer);
app.post('/api/reject-offer', handleRejectOffer);

//BROADCAST ENDPOINTS
app.post('/api/broadcast-now', handleBroadcastNow);
app.post('/api/broadcast-end', handleBroadcastEnd);
app.post('/api/is-user-broadcasting', handleIsUserBroadcasting);
app.post('/api/try-accept-broadcast', handleTryAcceptBroadcast);
app.post('/api/accept-broadcast', handleAcceptBroadcast);
app.post('/api/reject-broadcast', handleRejectBroadcast);
app.post('/api/cancel-broadcast-acceptance', handleCancelBroadcastAcceptance);

//CALL INTENT ENDPOINTS
app.post('/api/call-intent', handleCallIntent);
app.post('/api/undo-call-intent', handleUndoCallIntent);

//SUGGESTION ENDPOINTS
app.post('/api/accept-suggestion', handleAcceptSuggestion);
app.post('/api/dismiss-suggestion', handleDismissSuggestion);

app.get('/api/simulate-cron-round', handleCronRound)


app.get('/', (req, res) => {
  console.log("client IP address", req.ip)
  res.send('{"message": "Hello World! from port 3000!"}');// TODO - switch to res.json()?
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

