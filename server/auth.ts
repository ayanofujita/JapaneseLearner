import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { log } from "./vite";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  log("Setting up authentication...");

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          log(`Login attempt for email: ${email}`);
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            log(`Login failed for email: ${email} - ${user ? 'Invalid password' : 'User not found'}`);
            return done(null, false);
          }
          log(`Login successful for email: ${email}`);
          return done(null, user);
        } catch (error) {
          log(`Login error for email: ${email} - ${error}`);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      log(`Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        log(`Deserialization failed - user not found: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      log(`Deserialization error for user ${id}: ${error}`);
      done(error);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      log(`Registration attempt for email: ${email}`);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        log(`Registration failed - email already exists: ${email}`);
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ email, password: hashedPassword });
      log(`User created successfully: ${user.id}`);

      req.login(user, (err) => {
        if (err) {
          log(`Login after registration failed: ${err}`);
          return res.status(500).json({ message: "Login failed after registration" });
        }
        log(`Login after registration successful: ${user.id}`);
        return res.status(201).json(user);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      log(`Registration error: ${message}`);
      res.status(400).json({ message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    log(`Processing login request for email: ${req.body.email}`);
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) {
        log(`Login error: ${err}`);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        log(`Login failed - invalid credentials for email: ${req.body.email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) {
          log(`Session creation failed: ${err}`);
          return res.status(500).json({ message: "Login failed" });
        }
        log(`Login successful for user: ${user.id}`);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    if (req.user) {
      log(`Logging out user: ${req.user.id}`);
    }
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      log("Unauthenticated request to /api/user");
      return res.status(401).json({ message: "Not authenticated" });
    }
    log(`Authenticated user request: ${req.user.id}`);
    res.json(req.user);
  });
}