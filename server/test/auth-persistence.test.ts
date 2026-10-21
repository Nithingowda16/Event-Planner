import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Event } from '../src/models/event.model.js';
import { PlanProposal } from '../src/models/plan-proposal.model.js';
import { loadEnvConfig } from '../src/config/env.js';
import * as eventService from '../src/services/event.service.js';
import * as proposalService from '../src/services/proposal.service.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000); // 60s timeout in case binary download is needed

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await PlanProposal.deleteMany({});
});

describe('Milestone 2: Backend Core, MongoDB Persistence, Auth & Ownership Enforcement', () => {
  describe('1. Environment Configuration Validation', () => {
    it('validates correct environment configuration', () => {
      const validEnv = {
        PORT: '5000',
        NODE_ENV: 'test' as const,
        MONGODB_URI: 'mongodb://localhost:27017/celebrateos',
        JWT_SECRET: 'super-secure-jwt-secret-with-more-than-32-characters-12345',
        JWT_EXPIRES_IN: '7d',
        CLIENT_ORIGIN: 'http://localhost:5173',
      };

      const config = loadEnvConfig(validEnv);
      expect(config.PORT).toBe(5000);
      expect(config.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    });

    it('fails safely with descriptive error when JWT_SECRET is too short', () => {
      const invalidEnv = {
        JWT_SECRET: 'too-short', // Less than 32 chars
      };

      expect(() => loadEnvConfig(invalidEnv as NodeJS.ProcessEnv)).toThrow(
        /JWT_SECRET must be at least 32 characters long/
      );
    });
  });

  describe('2. User Model & Password Hashing Security', () => {
    it('hashes password with bcrypt and never exposes hash in JSON', async () => {
      const password = 'SecretPassword123!';
      const hash = await User.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format

      const user = await User.create({
        email: 'test@example.com',
        passwordHash: hash,
        fullName: 'Jane Doe',
      });

      // Verify comparePassword method
      expect(await user.comparePassword(password)).toBe(true);
      expect(await user.comparePassword('WrongPassword!')).toBe(false);

      // Verify toJSON transform redacts sensitive fields
      const json = user.toJSON();
      expect(json).not.toHaveProperty('passwordHash');
      expect(json).not.toHaveProperty('__v');
      expect(json).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('3. Authentication API Endpoints (Bearer Token Flow)', () => {
    const testUser = {
      email: 'planner@celebrateos.com',
      password: 'StrongPassword123!',
      fullName: 'Celebration Planner',
    };

    it('POST /api/v1/auth/register registers user and returns valid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.fullName).toBe(testUser.fullName);
    });

    it('POST /api/v1/auth/register rejects duplicate email with 409', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('POST /api/v1/auth/register rejects invalid input with 400 ValidationError', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          fullName: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
      expect(res.body.issues).toBeDefined();
    });

    it('POST /api/v1/auth/login returns token for valid credentials', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });

    it('POST /api/v1/auth/login returns generic 401 for wrong password (anti-enumeration)', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('POST /api/v1/auth/login returns generic 401 for non-existent email (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@celebrateos.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('GET /api/v1/auth/me returns authenticated user with valid Bearer token', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const token = regRes.body.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.fullName).toBe(testUser.fullName);
    });

    it('GET /api/v1/auth/me rejects request missing token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AuthenticationRequired');
    });

    it('GET /api/v1/auth/me rejects invalid / tampered token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('POST /api/v1/auth/logout acknowledges token discard on client with 200', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
      const token = regRes.body.token;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out successfully');
    });
  });

  describe('4. Tenant Ownership Enforcement & IDOR Defense', () => {
    it('strictly isolates events across distinct users', async () => {
      // User A creates an event
      const userA = await User.create({
        email: 'userA@example.com',
        passwordHash: await User.hashPassword('Password123!'),
        fullName: 'User A',
      });

      const userB = await User.create({
        email: 'userB@example.com',
        passwordHash: await User.hashPassword('Password123!'),
        fullName: 'User B',
      });

      const eventA = await eventService.createEvent(userA._id.toString(), {
        title: 'User A Wedding',
        eventType: 'wedding',
        eventDate: new Date('2026-12-25').toISOString(),
        location: 'Sunset Bay',
        guestCount: 120,
        totalBudget: 25000,
        currency: 'USD',
        preferences: {},
      });

      expect(eventA.id).toBeDefined();
      expect(eventA.userId).toBe(userA._id.toString());

      // User A can access their own event
      const fetchedByA = await eventService.getEventById(userA._id.toString(), eventA.id);
      expect(fetchedByA.id).toBe(eventA.id);

      // User B attempts to access User A's event -> Rejected with 404
      await expect(
        eventService.getEventById(userB._id.toString(), eventA.id)
      ).rejects.toThrow(/Event not found/);

      // User B attempts to update User A's event -> Rejected with 404
      await expect(
        eventService.updateEvent(userB._id.toString(), eventA.id, { title: 'Hacked Title' })
      ).rejects.toThrow(/Event not found/);

      // User B attempts to delete User A's event -> Rejected with 404
      await expect(
        eventService.deleteEvent(userB._id.toString(), eventA.id)
      ).rejects.toThrow(/Event not found/);

      // User B lists events -> Returns empty array (User A's event is completely invisible)
      const userBEvents = await eventService.getUserEvents(userB._id.toString());
      expect(userBEvents.data).toHaveLength(0);
      expect(userBEvents.pagination.total).toBe(0);
    });
  });

  describe('5. Optimistic Concurrency Control & Stale Proposal Handling', () => {
    it('increments event version on update and flags stale proposals with 409 Conflict', async () => {
      const user = await User.create({
        email: 'concurrency@example.com',
        passwordHash: await User.hashPassword('Password123!'),
        fullName: 'Concurrency Tester',
      });

      const userId = user._id.toString();

      // 1. Create Event (version = 0)
      const event = await eventService.createEvent(userId, {
        title: 'Golden Jubilee Birthday',
        eventType: 'birthday',
        eventDate: new Date('2026-11-15').toISOString(),
        location: 'Grand Ballroom',
        guestCount: 80,
        totalBudget: 10000,
        currency: 'USD',
        preferences: {},
      });

      expect(event.version).toBe(0);

      // 2. Update Event -> version increments to 1
      const updatedEvent = await eventService.updateEvent(userId, event.id, {
        guestCount: 95,
      });

      expect(updatedEvent.version).toBe(1);

      // 3. Create Proposal based on current version (baseEventVersion = 1)
      const proposal = await proposalService.createProposal(
        userId,
        event.id,
        'Reduce catering budget and increase entertainment',
        {
          summary: 'Redistribute 10% from catering to live band',
          budgetDeltas: [],
          taskChanges: [],
        }
      );

      expect(proposal.baseEventVersion).toBe(1);
      expect(proposal.status).toBe('pending');

      // 4. Another update occurs on the event before proposal is approved (e.g. guest count changes again)
      const concurrentUpdate = await eventService.updateEvent(userId, event.id, {
        guestCount: 110,
      });

      expect(concurrentUpdate.version).toBe(2);

      // 5. Attempting to approve the proposal should detect the version mismatch (proposal: v1, event: v2)
      // and safely mark proposal as 'stale' with 409 Conflict error
      await expect(
        proposalService.validateProposalForApproval(userId, proposal.id, 1)
      ).rejects.toThrow(/Conflict.*stale/i);

      // Verify proposal was updated to 'stale' in database
      const staleProposal = await proposalService.getProposalById(userId, proposal.id);
      expect(staleProposal.status).toBe('stale');
    });

    it('rejectProposal updates status to rejected with zero mutations to event data', async () => {
      const user = await User.create({
        email: 'rejection@example.com',
        passwordHash: await User.hashPassword('Password123!'),
        fullName: 'Rejection Tester',
      });

      const userId = user._id.toString();

      const event = await eventService.createEvent(userId, {
        title: 'Community Fundraiser',
        eventType: 'community',
        eventDate: new Date('2026-10-30').toISOString(),
        location: 'Town Square',
        guestCount: 300,
        totalBudget: 15000,
        currency: 'USD',
        preferences: {},
      });

      const proposal = await proposalService.createProposal(
        userId,
        event.id,
        'Add fireworks display',
        {
          summary: 'Add fireworks',
          budgetDeltas: [],
          taskChanges: [],
        }
      );

      expect(proposal.status).toBe('pending');

      const rejected = await proposalService.rejectProposal(userId, proposal.id);
      expect(rejected.status).toBe('rejected');

      // Verify event was NOT modified
      const currentEvent = await eventService.getEventById(userId, event.id);
      expect(currentEvent.version).toBe(0);
      expect(currentEvent.title).toBe('Community Fundraiser');
    });
  });
});
