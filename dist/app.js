import { auth, prisma } from './backend/auth.js';
import express from 'express';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import cors from 'cors';
import { handleMe, handleSignIn, handleSignInPhone, handleSignUpPhone, handleSignOut } from './endpoint-handlers/auth-handler.js';
import { handleCreateInvite, handleInviteSignUp, handleGetSentInvites } from './endpoint-handlers/invite-handler.js';
import { handleGetUserByPhone } from './endpoint-handlers/user-handler.js';
import { handleGetFriends } from './endpoint-handlers/friend-handler.js';
import { handleCreateMeeting, handleGetMeetings } from './endpoint-handlers/meeting-handler.js';
import { handleGetOffers, handleAcceptOffer, handleRejectOffer } from './endpoint-handlers/offer-handler.js';
import { handleCronRound } from './endpoint-handlers/cron-handler.js';
import cron from 'node-cron';
const app = express();
const port = 3000;
const hostname = '192.168.0.30';
app.use(cors({
    origin: 'http://localhost:8081'
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
// SAMPLE ENDPOINTS
app.get("/api/sample", (req, res) => {
    console.log("in the sample endpoint!!! ======---");
    res.json("{'hi': 'what my friend'}");
});
//cron.schedule('* * * * *', handleCronRound);
// AUTH ENDPOINTS
app.get("/api/me", handleMe);
app.post("/api/signup-phone", handleSignUpPhone);
app.post("/api/signInEmail", handleSignIn);
app.post("/api/signInPhone", handleSignInPhone);
app.post('/api/signout', handleSignOut);
// USER ENDPOINTS
app.post('/api/user-by-phone', handleGetUserByPhone);
// INVITE ENDPOINTS
app.post('/api/create-invite', handleCreateInvite);
app.post('/api/sign-up-accept-invite', handleInviteSignUp);
app.post('/api/get-sent-invites', handleGetSentInvites);
// TODO *** app.post('/api/sign-in-accept-invite, ()=>{})
// FRIEND ENDPOINTS
app.post('/api/get-friends', handleGetFriends);
//MEETING ENDPOINTS
app.post('/api/create-meeting', handleCreateMeeting);
app.post('/api/get-meetings', handleGetMeetings);
//OFFER ENDPOINTS
app.post('/api/get-offers', handleGetOffers);
app.post('/api/accept-offer', handleAcceptOffer);
app.post('/api/reject-offer', handleRejectOffer);
app.get('/api/simulate-cron-round', handleCronRound);
app.get('/', (req, res) => {
    console.log("client IP address", req.ip);
    res.send('{"message": "Hello World! from port 3000!"}'); // TODO - switch to res.json()?
});
app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map