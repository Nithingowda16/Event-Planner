import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listEventsHandler,
  createEventHandler,
  getEventHandler,
  updateEventHandler,
  deleteEventHandler,
  getBudgetHandler,
  updateBudgetItemHandler,
  rebalanceBudgetHandler,
} from '../controllers/event.controller.js';
import {
  listTasksHandler,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from '../controllers/task.controller.js';
import {
  listVendorsHandler,
  createVendorHandler,
  updateVendorHandler,
  deleteVendorHandler,
} from '../controllers/vendor.controller.js';
import { aiRouter } from './ai.routes.js';

export const eventRouter = Router();

// Enforce authentication on all event routes
eventRouter.use(requireAuth);

// 1. Event Core CRUD
eventRouter.get('/', listEventsHandler);
eventRouter.post('/', createEventHandler);
eventRouter.get('/:id', getEventHandler);
eventRouter.put('/:id', updateEventHandler);
eventRouter.delete('/:id', deleteEventHandler);

// 2. Authoritative Budget Endpoints
eventRouter.get('/:id/budget', getBudgetHandler);
eventRouter.put('/:id/budget/items/:itemId', updateBudgetItemHandler);
eventRouter.post('/:id/budget/rebalance', rebalanceBudgetHandler);

// 3. Timeline Task Endpoints
eventRouter.get('/:id/tasks', listTasksHandler);
eventRouter.post('/:id/tasks', createTaskHandler);
eventRouter.patch('/:id/tasks/:taskId', updateTaskHandler);
eventRouter.delete('/:id/tasks/:taskId', deleteTaskHandler);

// 4. Vendor Quotation Endpoints
eventRouter.get('/:id/vendors', listVendorsHandler);
eventRouter.post('/:id/vendors', createVendorHandler);
eventRouter.patch('/:id/vendors/:vendorId', updateVendorHandler);
eventRouter.delete('/:id/vendors/:vendorId', deleteVendorHandler);

// 5. AI Plan Generation & Revision Proposals
eventRouter.use('/:id/ai', aiRouter);
