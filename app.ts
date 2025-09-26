import {auth} from './auth.ts';  
import express from 'express';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node"; 

import cors from 'cors';
  // const express = require('express');
  // const cors = require('cors');
  const app = express();
  const port = 3000;

  app.use(cors({
    origin: 'http://localhost:8081'
  }));

  app.all("/api/auth/*splat", toNodeHandler(auth)); // For ExpressJS v4
    // app.all("/api/auth/*splat", toNodeHandler(auth)); For ExpressJS v5 
    // Mount express json middleware after Better Auth handler
    // or only apply it to routes that don't interact with Better Auth
  app.use(express.json());

  app.get("/api/me", async (req, res) => {
    console.log("hit API / ME!!!");
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      console.log("session-- from me", session);
    return res.json(session);
  });

  app.post("/api/signup", async (req, res) => {
    console.log("hit API / SIGNUP!!!");
    const data = await auth.api.signUpEmail({
      body: {
          name: "John Doe2", // required
          email: "john.doe2@example.com", // required
          password: "password1234", // required
      },
    });
    console.log("in signup - data", data);
    return res.json(data);
  });
  
  app.get('/', (req, res) => {
    res.send('{"message": "Hello World! from port 3000!"}');
  });

  app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
  });
