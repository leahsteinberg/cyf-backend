import {auth, prisma} from './auth.ts';  
import express from 'express';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node"; 
import cors from 'cors';
import { findUserByPhone, createUser } from './user.ts';
import { findInvite } from './invite.ts';
import { createFriendship, getFriends} from './friendship.ts';
import { createInvite, getSentInvites } from './invite.ts';


  const app = express();
  const port = 3000;
  const hostname = '192.168.0.30';


  app.use(cors({
    origin: 'http://localhost:8081'
  }));


  app.all("/api/auth/*splat", toNodeHandler(auth));


  app.use(express.json());


  app.get("/api/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
    return res.json(session);
  });

    app.post("/api/signup-phone", async (req, res) => {
      console.log("Sign Up Phone Endpoint", req.body);
      const { email, phoneNumber, name, password } = req.body;
      const user = await createUser({ email, phoneNumber, name, password });
      console.log("user is", user)
      return res.json(user);
  });


    app.post("/api/signInEmail", async (req, res) => {
    const session = await auth.api.signInEmail({
        body: {
          email: req.body.email,
          password: req.body.password,
          rememberMe: true,
        },
        headers: fromNodeHeaders(req.headers),
      });
    return res.json(session);
  });


    app.post("/api/signInPhone", async (req, res) => {
      // TODO - can I use this instead of the email one???
    const session = await auth.api.signInPhoneNumber({
        body: {
          phoneNumber: req.body.phoneNumber,
          password: req.body.password,
          rememberMe: true,
        },
        headers: fromNodeHeaders(req.headers),
      });
    return res.json(session);
  });

  app.post('/api/create-invite', async (req, res) => {
    const {userFromId, userToPhoneNumber} = req.body;
    console.log("create invite - got - ", {userFromId, userToPhoneNumber});
    const invitation = await createInvite({userFromId, userToPhoneNumber});
    res.send(invitation);// TODO - switch to res.json()?
  });

  app.post('/api/user-by-phone', async (req, res) => {
    const {userPhoneNumber} = req.body;
    const user = await findUserByPhone(userPhoneNumber);
    res.send(user);// TODO - switch to res.json()?
  });

  app.post('/api/get-friends', async (req, res) => {
    const {id} = req.body;
    const friends = await getFriends(id);
    const sentInvites = await getSentInvites(id)
    console.log("invites out", sentInvites)
    res.json(friends);// TODO - switch to res.json()?
  });

  app.post('/api/sign-up-accept-invite', async (req, res) => {
    const {token, email, phoneNumber, name, password} = req.body;
    console.log("/api/sign-up-accept-invite", {token, email, phoneNumber, name, password})
    const userTo = await findUserByPhone(phoneNumber);
    if (!userTo) {
      const invite = await findInvite(token, phoneNumber);
      if (invite && invite.userToPhoneNumber === phoneNumber) {
        const {userFromId} = invite;
        const newUser = await createUser({email, phoneNumber, name, password});
        const newFriendship = await createFriendship({userId1: userFromId, userId2: newUser.user.id})
        res.json(newUser);
      }
    }
  });


  app.get('/', (req, res) => {
    console.log("client IP address", req.ip)
    res.send('{"message": "Hello World! from port 3000!"}');// TODO - switch to res.json()?
  });

  app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
  });


// const key = fs.readFileSync("./cert.key");
// const cert = fs.readFileSync("./cert.crt")
// console.log({key, cert})

// const server = https.createServer({
//   key,
//   cert,
// }, app);


// server.listen(port, hostname, () => {
//   console.log(`Server running at https://${hostname}:${port}/`);
// });

  //  const httpsServer = https.createServer(credentials, app);

  //   httpsServer.listen(port, () => {
  //       console.log(`HTTPS server running on https://localhost:${port}`);
  //   });


