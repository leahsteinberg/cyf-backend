import {auth, prisma} from './backend/auth.ts';  
import express from 'express';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node"; 
import cors from 'cors';
import { findUserByPhone, createUser } from './backend/user.ts';
import { findInvite } from './backend/invite.ts';
import { createFriendship, getFriends} from './backend/friendship.ts';
import { createInvite, getSentInvites } from './backend/invite.ts';
import { createMeeting, getCreatedMeetings } from './backend/meeting.ts';
import { handleMe, handleSignIn, handleSignInPhone, handleSignUpPhone } from './endpoint-handlers/auth-handler.ts';
import { handleCreateInvite, handleInviteSignUp } from './endpoint-handlers/invite-handler.ts';
import { handleGetUserByPhone } from './endpoint-handlers/user-handler.ts';
import { handleGetFriends } from './endpoint-handlers/friend-handler.ts';
import { handleCreateMeeting } from './endpoint-handlers/meeting-handler';

const app = express();
const port = 3000;
const hostname = '192.168.0.30';
app.use(cors({
  origin: 'http://localhost:8081'
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

// AUTH ENDPOINTS
app.get("/api/me", handleMe);
app.post("/api/signup-phone", handleSignUpPhone);
app.post("/api/signInEmail", handleSignIn);
app.post("/api/signInPhone", handleSignInPhone);

// USER ENDPOINTS
app.post('/api/user-by-phone', handleGetUserByPhone);


// INVITE ENDPOINTS
app.post('/api/create-invite', handleCreateInvite);
app.post('/api/sign-up-accept-invite', handleInviteSignUp);
// TODO *** app.post('/api/sign-in-accept-invite, ()=>{})


// FRIEND ENDPOINTS
app.post('/api/get-friends', handleGetFriends);


//MEETING ENDPOINTS
app.post('/api/create-meeting', handleCreateMeeting);


app.get('/', (req, res) => {
  console.log("client IP address", req.ip)
  res.send('{"message": "Hello World! from port 3000!"}');// TODO - switch to res.json()?
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

