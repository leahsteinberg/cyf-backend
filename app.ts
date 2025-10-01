import {auth} from './auth.ts';  
import express from 'express';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node"; 
import twilio from 'twilio';
import cors from 'cors';
import { phoneNumber } from 'better-auth/plugins';

  const app = express();
  const port = 3000;

//   const accountSid = process.env.TWILIO_ACCOUNT_SID;
//   const authToken = process.env.TWILIO_AUTH_TOKEN;
//   console.log({accountSid, authToken});
//   const client = twilio(accountSid, authToken);

// client.messages
//           .create({
//             to: recipientPhoneNumber,
//             from: twilioPhoneNumber,
//             body: messageBody,
//           })
//           .then(message => console.log(`Message sent with SID: ${message.sid}`))
//           .catch(error => console.error(`Error sending message: ${error}`));



  app.use(cors({
    origin: 'http://localhost:8081'
  }));

  app.all("/api/auth/*splat", toNodeHandler(auth)); // For ExpressJS v4
    // app.all("/api/auth/*splat", toNodeHandler(auth)); For ExpressJS v5 
    // Mount express json middleware after Better Auth handler
    // or only apply it to routes that don't interact with Better Auth
  app.use(express.json());

  app.get("/api/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
    return res.json(session);
  });

  app.post("/api/signup", async (req, res) => {
    const data = await auth.api.signUpEmail({
      body: {
          name: "Unknown Name", // required
          email: req.body.email, // required
          password: req.body.password, // required
      },
    });
    return res.json(data);
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
      //console.log("signed in???--", session);
    return res.json(session);
  });


      app.post("/api/signInPhone", async (req, res) => {
    const session = await auth.api.signInPhoneNumber({
        body: {
          phoneNumber: req.body.phoneNumber,
          password: req.body.password,
          rememberMe: true,
        },
        headers: fromNodeHeaders(req.headers),
      });
      //console.log("signed in???--", session);
    return res.json(session);
  });

    app.post("/api/addContacts", async (req, res) => {
    console.log(req.body);
    // const session = await auth.api.signInEmail({
    //     body: {
    //       email: req.body.email,
    //       password: req.body.password,
    //       rememberMe: true,
    //     },
    //     headers: fromNodeHeaders(req.headers),
    //   });
      //console.log("signed in???--", session);
    return res.json({});
  });

  app.get('/', (req, res) => {
    res.send('{"message": "Hello World! from port 3000!"}');
  });

  app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
  });


