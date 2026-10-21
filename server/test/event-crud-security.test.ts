import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Event } from '../src/models/event.model.js';
import { Task } from '../src/models/task.model.js';
import { VendorQuotation } from '../src/models/vendor.model.js';
import { PlanProposal } from '../src/models/plan-proposal.model.js';

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
  await VendorQuotation.deleteMany({});
  await PlanProposal.deleteMany({});
});

describe('Milestone 3: Event CRUD, Budget, Task/Vendor Storage APIs & Cross-User Security', () => {
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
    title: 'Autumn Garden Wedding',
    eventType: 'wedding',
    eventDate: new Date('2026-11-20T18:00:00.000Z').toISOString(),
    location: 'Oakridge Manor',
    guestCount: 120,
    totalBudget: 25000,
    currency: 'USD',
    preferences: {
      theme: 'Botanical Elegance',
      vibe: 'Warm and intimate',
    },
  };

  describe('1. Authenticated Event CRUD & Concurrency', () => {
    it('requires authentication for event endpoints (401 without Bearer token)', async () => {
      const res = await request(app).get('/api/v1/events');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AuthenticationRequired');
    });

    it('creates an event and initializes authoritative starter budget', async () => {
      const { token } = await createAuthenticatedUser('eventcreator@test.com', 'Event Creator');

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      expect(res.status).toBe(201);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.title).toBe(baseEventPayload.title);
      expect(res.body.event.totalBudget).toBe(25000);
      expect(res.body.event.version).toBe(0);
    });

    it('rejects invalid event payload with 400 ValidationError', async () => {
      const { token } = await createAuthenticatedUser('validator@test.com', 'Validator');

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Hi', // too short
          eventType: 'unknown_type',
          totalBudget: -500, // negative budget
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('lists user events with pagination and metadata', async () => {
      const { token } = await createAuthenticatedUser('pager@test.com', 'Pager User');

      // Create 3 events
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/v1/events')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...baseEventPayload, title: `Event ${i}` });
      }

      const res = await request(app)
        .get('/api/v1/events?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('updates event and enforces optimistic concurrency control', async () => {
      const { token } = await createAuthenticatedUser('concurrency@test.com', 'Concurrency User');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // Update with correct expectedVersion = 0
      const updateRes = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          expectedVersion: 0,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.event.title).toBe('Updated Title');
      expect(updateRes.body.event.version).toBe(1);

      // Attempting to update with stale version 0 should fail with 409 Conflict
      const staleRes = await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Stale Attempt',
          expectedVersion: 0,
        });

      expect(staleRes.status).toBe(409);
      expect(staleRes.body.message).toContain('Conflict');
    });
  });

  describe('2. Authoritative Budget Endpoints', () => {
    it('GET /api/v1/events/:id/budget retrieves current allocations and totals', async () => {
      const { token } = await createAuthenticatedUser('budgeteer@test.com', 'Budget Tester');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const res = await request(app)
        .get(`/api/v1/events/${eventId}/budget`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.budget).toBeDefined();
      expect(res.body.budget.totalBudget).toBe(25000);
      expect(res.body.budget.totalAllocated).toBe(25000);
      expect(res.body.budget.items.length).toBeGreaterThan(0);
    });

    it('PUT /api/v1/events/:id/budget/items/:itemId modifies item and rebalances authoritatively', async () => {
      const { token } = await createAuthenticatedUser('itemupdater@test.com', 'Item Updater');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const budgetRes = await request(app)
        .get(`/api/v1/events/${eventId}/budget`)
        .set('Authorization', `Bearer ${token}`);

      const firstItem = budgetRes.body.budget.items[0];

      // Update allocated amount for first item
      const updateRes = await request(app)
        .put(`/api/v1/events/${eventId}/budget/items/${firstItem.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          allocatedAmount: 10000,
          actualSpent: 2500,
          rationale: 'Secured premier venue package',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.budget.totalAllocated).toBe(25000);

      const updatedItem = updateRes.body.budget.items.find((i: { id: string }) => i.id === firstItem.id);
      expect(updatedItem.allocatedAmount).toBe(10000);
      expect(updatedItem.actualSpent).toBe(2500);
      expect(updatedItem.isLocked).toBe(true);
    });

    it('POST /api/v1/events/:id/budget/rebalance calculates allocations and absorbs residuals', async () => {
      const { token } = await createAuthenticatedUser('rebalancer@test.com', 'Rebalance User');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      const rebalanceRes = await request(app)
        .post(`/api/v1/events/${eventId}/budget/rebalance`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          totalBudget: 30000,
          currency: 'USD',
          categories: [
            { category: 'Venue', percentage: 40 },
            { category: 'Catering', percentage: 35 },
            { category: 'Contingency & Miscellaneous', percentage: 25 },
          ],
        });

      expect(rebalanceRes.status).toBe(200);
      expect(rebalanceRes.body.budget.totalBudget).toBe(30000);
      expect(rebalanceRes.body.budget.totalAllocated).toBe(30000);
      expect(rebalanceRes.body.budget.items).toHaveLength(3);
    });
  });

  describe('3. Timeline Task Endpoints', () => {
    it('performs task CRUD operations strictly scoped to event', async () => {
      const { token } = await createAuthenticatedUser('taskmaster@test.com', 'Task Master');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // 1. Create Task
      const taskRes = await request(app)
        .post(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          phase: 'pre_event',
          title: 'Book Photographer',
          priority: 'high',
          category: 'Photography',
        });

      expect(taskRes.status).toBe(201);
      expect(taskRes.body.task.title).toBe('Book Photographer');
      const taskId = taskRes.body.task.id;

      // 2. List Tasks
      const listRes = await request(app)
        .get(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.tasks).toHaveLength(1);

      // 3. Update Task Status
      const updateRes = await request(app)
        .patch(`/api/v1/events/${eventId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'completed',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.task.status).toBe('completed');

      // 4. Delete Task
      const deleteRes = await request(app)
        .delete(`/api/v1/events/${eventId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const listAfterDelete = await request(app)
        .get(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`);
      expect(listAfterDelete.body.tasks).toHaveLength(0);
    });
  });

  describe('4. Vendor Quotation Endpoints', () => {
    it('performs vendor quotation CRUD operations scoped to event', async () => {
      const { token } = await createAuthenticatedUser('vendormgr@test.com', 'Vendor Manager');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;

      // 1. Create Vendor Quote
      const vendorRes = await request(app)
        .post(`/api/v1/events/${eventId}/vendors`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Catering',
          vendorName: 'Gourmet Delights LLC',
          contactEmail: 'sales@gourmetdelights.com',
          quotedAmount: 6500,
          deliverablesNotes: 'Includes 3-course dinner, cocktail hour, and service staff',
          ratingScore: 5,
        });

      expect(vendorRes.status).toBe(201);
      expect(vendorRes.body.vendor.vendorName).toBe('Gourmet Delights LLC');
      const vendorId = vendorRes.body.vendor.id;

      // 2. List Vendors
      const listRes = await request(app)
        .get(`/api/v1/events/${eventId}/vendors`)
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.vendors).toHaveLength(1);

      // 3. Update Vendor Quote Status
      const updateRes = await request(app)
        .patch(`/api/v1/events/${eventId}/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'hired',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.vendor.status).toBe('hired');

      // 4. Delete Vendor Quote
      const deleteRes = await request(app)
        .delete(`/api/v1/events/${eventId}/vendors/${vendorId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
    });
  });

  describe('5. Cross-User Security & Tenant Isolation (IDOR Defense)', () => {
    it('strictly forbids User B from accessing, mutating, or deleting User A resources', async () => {
      const userA = await createAuthenticatedUser('victim@test.com', 'User A');
      const userB = await createAuthenticatedUser('attacker@test.com', 'User B');

      // User A creates an Event
      const eventRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${userA.token}`)
        .send(baseEventPayload);

      const eventAId = eventRes.body.event.id;

      // User A creates a Task
      const taskRes = await request(app)
        .post(`/api/v1/events/${eventAId}/tasks`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          phase: 'pre_event',
          title: 'Confidential Task',
        });
      const taskAId = taskRes.body.task.id;

      // User A creates a Vendor Quote
      const vendorRes = await request(app)
        .post(`/api/v1/events/${eventAId}/vendors`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          category: 'Security',
          vendorName: 'Secret Guard Co',
          quotedAmount: 1200,
        });
      const vendorAId = vendorRes.body.vendor.id;

      // User B attempts to GET Event A -> 404
      const getEventRes = await request(app)
        .get(`/api/v1/events/${eventAId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(getEventRes.status).toBe(404);

      // User B attempts to UPDATE Event A -> 404
      const updateEventRes = await request(app)
        .put(`/api/v1/events/${eventAId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ title: 'Hacked Event' });
      expect(updateEventRes.status).toBe(404);

      // User B attempts to DELETE Event A -> 404
      const deleteEventRes = await request(app)
        .delete(`/api/v1/events/${eventAId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(deleteEventRes.status).toBe(404);

      // User B attempts to GET Budget for Event A -> 404
      const getBudgetRes = await request(app)
        .get(`/api/v1/events/${eventAId}/budget`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(getBudgetRes.status).toBe(404);

      // User B attempts to list Tasks for Event A -> 404
      const getTasksRes = await request(app)
        .get(`/api/v1/events/${eventAId}/tasks`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(getTasksRes.status).toBe(404);

      // User B attempts to UPDATE Task A -> 404
      const updateTaskRes = await request(app)
        .patch(`/api/v1/events/${eventAId}/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ title: 'Hacked Task' });
      expect(updateTaskRes.status).toBe(404);

      // User B attempts to DELETE Task A -> 404
      const deleteTaskRes = await request(app)
        .delete(`/api/v1/events/${eventAId}/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(deleteTaskRes.status).toBe(404);

      // User B attempts to list Vendors for Event A -> 404
      const getVendorsRes = await request(app)
        .get(`/api/v1/events/${eventAId}/vendors`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(getVendorsRes.status).toBe(404);

      // User B attempts to UPDATE Vendor A -> 404
      const updateVendorRes = await request(app)
        .patch(`/api/v1/events/${eventAId}/vendors/${vendorAId}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ quotedAmount: 0 });
      expect(updateVendorRes.status).toBe(404);

      // User B attempts to DELETE Vendor A -> 404
      const deleteVendorRes = await request(app)
        .delete(`/api/v1/events/${eventAId}/vendors/${vendorAId}`)
        .set('Authorization', `Bearer ${userB.token}`);
      expect(deleteVendorRes.status).toBe(404);
    });

    it('cross-event IDOR: prevents accessing resource belonging to Event A via Event B URL', async () => {
      const user = await createAuthenticatedUser('crossevent@test.com', 'Cross Event User');

      // Create Event 1 and Task 1
      const event1Res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${user.token}`)
        .send(baseEventPayload);
      const event1Id = event1Res.body.event.id;

      const task1Res = await request(app)
        .post(`/api/v1/events/${event1Id}/tasks`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ phase: 'pre_event', title: 'Task in Event 1' });
      const task1Id = task1Res.body.task.id;

      // Create Event 2
      const event2Res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ ...baseEventPayload, title: 'Event 2' });
      const event2Id = event2Res.body.event.id;

      // Attempt to update Task 1 using Event 2 URL
      const crossEventRes = await request(app)
        .patch(`/api/v1/events/${event2Id}/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Mismatch Attempt' });

      expect(crossEventRes.status).toBe(404);
    });
  });

  describe('6. Cascading Deletion of Dependent Resources (No Orphaned Records)', () => {
    it('deleting an event automatically removes all related tasks, vendors, and proposals', async () => {
      const { token, user } = await createAuthenticatedUser('cascade@test.com', 'Cascade Tester');

      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send(baseEventPayload);

      const eventId = createRes.body.event.id;
      const eventObjId = new mongoose.Types.ObjectId(eventId);

      // Create a task
      await request(app)
        .post(`/api/v1/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ phase: 'day_of', title: 'Cleanup Task' });

      // Create a vendor quote
      await request(app)
        .post(`/api/v1/events/${eventId}/vendors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'Audio', vendorName: 'Sound FX', quotedAmount: 800 });

      // Create a plan proposal directly in DB
      await PlanProposal.create({
        eventId: eventObjId,
        userId: new mongoose.Types.ObjectId(user.id),
        baseEventVersion: 0,
        userPrompt: 'Test proposal',
        proposedChanges: { summary: 'test', budgetDeltas: [], taskChanges: [] },
      });

      // Verify records exist in database
      expect(await Task.countDocuments({ eventId: eventObjId })).toBe(1);
      expect(await VendorQuotation.countDocuments({ eventId: eventObjId })).toBe(1);
      expect(await PlanProposal.countDocuments({ eventId: eventObjId })).toBe(1);

      // Delete Event
      const deleteRes = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      // Verify cascading cleanup
      expect(await Event.countDocuments({ _id: eventObjId })).toBe(0);
      expect(await Task.countDocuments({ eventId: eventObjId })).toBe(0);
      expect(await VendorQuotation.countDocuments({ eventId: eventObjId })).toBe(0);
      expect(await PlanProposal.countDocuments({ eventId: eventObjId })).toBe(0);
    });
  });
});
