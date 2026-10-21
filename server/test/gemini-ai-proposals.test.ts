import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Event } from '../src/models/event.model.js';
import { Task } from '../src/models/task.model.js';
import { PlanProposal } from '../src/models/plan-proposal.model.js';
import { setGeminiMockHandler } from '../src/services/gemini.service.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await Task.deleteMany({});
  await PlanProposal.deleteMany({});
  // Reset mock handler to default valid response before each test
  setGeminiMockHandler(null);
});

describe('Milestone 4: Gemini AI Integration Service, Schema Validation & Proposal Diff Engine', () => {
  async function createAuthenticatedUser(email: string, name: string) {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'Password123!',
        fullName: name,
      });
    return {
      token: res.body.token as string,
      user: res.body.user as { id: string; email: string; fullName: string },
    };
  }

  const baseEventPayload = {
    title: 'Silver Bells Winter Wedding',
    eventType: 'wedding',
    eventDate: new Date('2026-12-15T19:00:00.000Z').toISOString(),
    location: 'Alpine Lodge',
    guestCount: 150,
    totalBudget: 40000,
    currency: 'USD',
    preferences: {
      theme: 'Winter Wonderland',
      vibe: 'Cozy and luxurious',
    },
  };

  const validMockPlan = {
    themeConcept: 'Frosted Pine & Candlelight',
    executiveSummary: 'An intimate winter celebration featuring evergreen floral arrangements and fireside warmth.',
    budgetBreakdown: [
      { category: 'Venue & Lodging', percentage: 38, rationale: 'Historic alpine hall rental' },
      { category: 'Catering & Mulled Wine', percentage: 32, rationale: 'Three-course seasonal feast' },
      { category: 'Winter Florals & Decor', percentage: 12, rationale: 'Pine garlands and fairy lights' },
      { category: 'Acoustic String Quartet', percentage: 8, rationale: 'Ceremony and cocktail music' },
      { category: 'Photography & Album', percentage: 7, rationale: 'Full-day snow photo coverage' },
      { category: 'Contingency & Miscellaneous', percentage: 3, rationale: 'Buffer for unexpected winter logistics' },
    ],
    timelinePhases: [
      {
        phase: 'pre_event',
        tasks: [
          { title: 'Finalize Snow-cat Transport', description: 'Coordinate mountain access for guests', priority: 'high', category: 'Logistics' },
          { title: 'Tasting for Winter Menu', description: 'Sample braised short ribs and seasonal dessert', priority: 'medium', category: 'Catering' },
        ],
      },
      {
        phase: 'day_of',
        tasks: [
          { title: 'Fireside Warmth Check', description: 'Ensure lodge fireplaces are stoked before guest arrival', priority: 'high', category: 'Facilities' },
        ],
      },
    ],
    vendorChecklist: [
      { category: 'Mountain Shuttle Service', estimatedCostPercentage: 4, keyDeliverables: 'Guest transportation' },
      { category: 'Artisan Fireplace Stylist', estimatedCostPercentage: 3, keyDeliverables: 'Mantle decor' },
    ],
  };

  const validMockRevision = {
    summary: 'Shift budget from floral decor to live band and add ski-lift photoshoot',
    budgetAdjustments: [
      { category: 'Venue & Lodging', percentage: 38, rationale: 'Maintained alpine hall rental' },
      { category: 'Catering & Mulled Wine', percentage: 30, rationale: 'Slightly reduced drink package' },
      { category: 'Live 6-Piece Band', percentage: 15, rationale: 'Upgraded from string quartet to full band' },
      { category: 'Winter Florals & Decor', percentage: 7, rationale: 'Simplified centerpieces' },
      { category: 'Photography & Album', percentage: 7, rationale: 'Full-day snow photo coverage' },
      { category: 'Contingency & Miscellaneous', percentage: 3, rationale: 'Winter weather buffer' },
    ],
    taskChanges: [
      { action: 'add' as const, phase: 'pre_event' as const, title: 'Book 6-Piece Live Swing Band', priority: 'high' as const },
      { action: 'add' as const, phase: 'day_of' as const, title: 'Coordinate Ski-Lift Photoshoot Session', priority: 'medium' as const },
    ],
    vendorRecommendations: ['High-energy swing/funk wedding band', 'Thermal outdoor sound engineer'],
  };

  describe('1. Plan Generation with Authoritative Budgeting & Task Persistence', () => {
    it('generates structured plan, recalculates budget authoritatively, and persists tasks', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockPlan));

      const { token } = await createAuthenticatedUser('planner1@test.com', 'Planner One');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // Trigger AI Plan Generation
      const genRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/generate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ additionalNotes: 'Focus on outdoor snow portraits' });

      expect(genRes.status).toBe(200);
      expect(genRes.body.themeConcept).toBe(validMockPlan.themeConcept);
      expect(genRes.body.tasksCreatedCount).toBe(3);
      expect(genRes.body.event.status).toBe('planned');

      // Verify budget items were calculated deterministically on the event
      const budgetRes = await request(app)
        .get(`/api/v1/events/${eventId}/budget`)
        .set('Authorization', `Bearer ${token}`);

      expect(budgetRes.status).toBe(200);
      expect(budgetRes.body.budget.totalAllocated).toBe(40000);
      expect(budgetRes.body.budget.items).toHaveLength(6);

      // Verify tasks were persisted in Task collection
      const tasksRes = await request(app)
        .get(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(tasksRes.status).toBe(200);
      expect(tasksRes.body.tasks).toHaveLength(3);
      expect(tasksRes.body.tasks.some((t: { title: string }) => t.title === 'Finalize Snow-cat Transport')).toBe(true);
    });

    it('cross-user: rejects plan generation on another user’s event with 404', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockPlan));

      const userA = await createAuthenticatedUser('ownerA@test.com', 'Owner A');
      const userB = await createAuthenticatedUser('attackerB@test.com', 'Attacker B');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${userA.token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const genRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/generate`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({});

      expect(genRes.status).toBe(404);
    });
  });

  describe('2. AI Error Handling: Malformed JSON, Schema Invalidation & Provider Failures', () => {
    it('safely handles malformed non-JSON from AI without corrupting event (502)', async () => {
      setGeminiMockHandler(async () => 'This is not JSON at all! Just raw plain text.');

      const { token } = await createAuthenticatedUser('error1@test.com', 'Error Tester 1');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const genRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/generate`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(genRes.status).toBe(502);
      expect(genRes.body.message).toContain('not valid JSON');

      // Verify event was NOT corrupted
      const eventRes = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(eventRes.body.event.status).toBe('draft');
    });

    it('safely rejects schema-invalid AI output with 502', async () => {
      // Missing required executiveSummary and invalid negative percentage
      const invalidOutput = {
        themeConcept: 'Broken Plan',
        budgetBreakdown: [{ category: 'Venue', percentage: -50, rationale: 'Bad' }],
        timelinePhases: [],
        vendorChecklist: [],
      };

      setGeminiMockHandler(async () => JSON.stringify(invalidOutput));

      const { token } = await createAuthenticatedUser('error2@test.com', 'Error Tester 2');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const genRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/generate`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(genRes.status).toBe(502);
      expect(genRes.body.message).toContain('failed strict schema validation');
    });
  });

  describe('3. AI Revision Proposals: Proposal Creation Without Mutating Event', () => {
    it('generates a revision proposal, stores diffSnapshot, and leaves active event unmodified', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockRevision));

      const { token } = await createAuthenticatedUser('reviser@test.com', 'Reviser');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // Request Revision Proposal
      const propRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/propose-revision`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          userPrompt: 'Upgrade to live swing band and cut some floral decor',
        });

      expect(propRes.status).toBe(201);
      expect(propRes.body.proposal).toBeDefined();
      expect(propRes.body.proposal.status).toBe('pending');
      expect(propRes.body.proposal.baseEventVersion).toBe(0);
      expect(propRes.body.diffSnapshot).toBeDefined();
      expect(propRes.body.diffSnapshot.budgetSummary.deltas.length).toBeGreaterThan(0);

      // Verify active event was NOT modified!
      const eventCheck = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(eventCheck.body.event.version).toBe(0);
      expect(eventCheck.body.event.status).toBe('draft');
    });
  });

  describe('4. Proposal Approval, Optimistic Concurrency & Stale Detection', () => {
    it('approves and applies proposal, updates budget/tasks, and increments event version', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockRevision));

      const { token } = await createAuthenticatedUser('approver@test.com', 'Approver');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const propRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/propose-revision`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userPrompt: 'Add live swing band' });

      const proposalId = propRes.body.proposal.id;

      // Approve Proposal
      const approveRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expectedVersion: 0 });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.event.version).toBe(1);
      expect(approveRes.body.proposal.status).toBe('applied');

      // Verify tasks added by proposal exist in database
      const tasksRes = await request(app)
        .get(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(tasksRes.body.tasks.some((t: { title: string }) => t.title.includes('Live Swing Band'))).toBe(true);

      // Verify duplicate approval attempt is rejected with 400
      const dupApproveRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expectedVersion: 1 });

      expect(dupApproveRes.status).toBe(400);
      expect(dupApproveRes.body.message).toContain('Only pending proposals can be reviewed');
    });

    it('rejects stale proposal with 409 Conflict when event was modified in the interim', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockRevision));

      const { token } = await createAuthenticatedUser('staletester@test.com', 'Stale Tester');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // 1. Proposal created at version 0
      const propRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/propose-revision`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userPrompt: 'Add swing band' });

      const proposalId = propRes.body.proposal.id;

      // 2. Event is updated directly by user -> version advances to 1
      await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ guestCount: 175 });

      // 3. User attempts to approve the stale proposal
      const approveRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expectedVersion: 0 });

      expect(approveRes.status).toBe(409);
      expect(approveRes.body.message).toContain('Proposal is now stale');

      // 4. Verify proposal status transitioned to 'stale'
      const getProposalRes = await request(app)
        .get(`/api/v1/events/${eventId}/ai/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getProposalRes.body.proposal.status).toBe('stale');
    });
  });

  describe('5. Proposal Rejection & Cross-User Security', () => {
    it('rejecting a proposal marks it rejected and leaves event completely untouched', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockRevision));

      const { token } = await createAuthenticatedUser('rejector@test.com', 'Rejector');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const propRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/propose-revision`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userPrompt: 'Change everything' });

      const proposalId = propRes.body.proposal.id;

      // Reject Proposal
      const rejectRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/reject`)
        .set('Authorization', `Bearer ${token}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.proposal.status).toBe('rejected');

      // Verify event was NOT modified
      const eventRes = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(eventRes.body.event.version).toBe(0);
    });

    it('cross-user: User B cannot access, approve, or reject User A’s proposal', async () => {
      setGeminiMockHandler(async () => JSON.stringify(validMockRevision));

      const userA = await createAuthenticatedUser('victimA@test.com', 'Victim A');
      const userB = await createAuthenticatedUser('hackerB@test.com', 'Hacker B');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${userA.token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const propRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/propose-revision`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ userPrompt: 'Private revision' });

      const proposalId = propRes.body.proposal.id;

      // User B tries to view proposal -> 404
      const getRes = await request(app)
        .get(`/api/v1/events/${eventId}/ai/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(getRes.status).toBe(404);

      // User B tries to approve proposal -> 404
      const approveRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/approve`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({});
      expect(approveRes.status).toBe(404);

      // User B tries to reject proposal -> 404
      const rejectRes = await request(app)
        .post(`/api/v1/events/${eventId}/ai/proposals/${proposalId}/reject`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(rejectRes.status).toBe(404);
    });
  });
});
