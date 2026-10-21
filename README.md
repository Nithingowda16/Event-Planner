# CelebrateOS — AI-Powered Celebration & Event Planner
> **PromptWars Challenge 5** | Engineered with MERN, TypeScript & Google Gemini API

CelebrateOS is a full-stack, enterprise-grade AI event planning operating system. It orchestrates weddings, milestone birthdays, and community gatherings using Generative AI with strict deterministic calculation boundaries, optimistic concurrency control, and human-in-the-loop revision approval.

---

## 🏛️ System Architecture Principles

1. **Strict Monorepo Separation**: Powered by standard `npm workspaces` with `@celebrateos/shared`, `@celebrateos/server`, and `@celebrateos/client`.
2. **Authoritative Calculation Boundary**: The backend is the **sole authoritative source** for budget allocations, rounding residual absorption, and invariant enforcement ($\sum \text{allocated} \equiv \text{totalBudget}$). Frontend calculations are explicitly non-binding previews.
3. **Optimistic Concurrency & Stale Proposal Prevention**: AI revision proposals record `baseEventVersion = event.__v`. Approval requests verify that the event has not been mutated concurrently before applying changes atomically. Stale proposals are rejected with `409 Conflict`.
4. **Zero Client Secret Leakage**: `GEMINI_API_KEY`, `MONGODB_URI`, and `JWT_SECRET` reside strictly in server environment variables.
5. **Accessibility by Default (WCAG 2.1 AA)**: Semantic HTML5 landmarks, high-contrast palette ($\ge 4.5:1$), keyboard navigation, and ARIA live regions for async AI operations.

---

## 📋 Prerequisites

- **Node.js**: v20.x or v24.x LTS (Recommended)
- **npm**: v10+ (comes bundled with Node)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas connection URI
- **Google Gemini API Key**: Obtainable from Google AI Studio (for `gemini-2.5-flash`)

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the master environment template:
```bash
cp .env.example .env
```
Populate `.env` with your MongoDB connection string and Gemini API Key:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/celebrateos
JWT_SECRET=your_secure_random_jwt_secret_min_32_characters
GEMINI_API_KEY=your_gemini_api_key
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Build Shared Packages
```bash
npm run --workspace=@celebrateos/shared build
```

### 4. Running the Applications
- **Start Backend Development Server** (Express with tsx watch):
  ```bash
  npm run dev:server
  ```
  API available at `http://localhost:5000` (Healthcheck: `http://localhost:5000/api/health`).

- **Start Frontend Development Server** (Vite + React HMR):
  ```bash
  npm run dev:client
  ```
  Client UI available at `http://localhost:5173`.

---

## 🧪 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run build` | Compiles `@celebrateos/shared`, `@celebrateos/server`, and `@celebrateos/client`. |
| `npm run typecheck` | Executes strict TypeScript compilation checks (`tsc --noEmit`) across all workspaces. |
| `npm run test` | Runs automated unit and integration tests using Vitest. |
| `npm run dev:server` | Starts the Express backend in hot-reload mode (`tsx watch`). |
| `npm run dev:client` | Starts the Vite React frontend dev server with instant HMR. |

---

## 🗺️ Implementation Roadmap

- [x] **Milestone 0: Monorepo Foundation & Workspace Scaffolding** *(Completed)*
- [ ] **Milestone 1: Shared Schemas, Validation & Authoritative Budget Engine**
- [ ] **Milestone 2: Backend Core, MongoDB Persistence, Auth & Ownership Enforcement**
- [ ] **Milestone 3: Event CRUD, Budget & Task/Vendor Storage API (with Cross-User Access Tests)**
- [ ] **Milestone 4: Gemini AI Integration Service (Verified SDK/Model, Schema Enforcement, Proposal Diff Engine)**
- [ ] **Milestone 5: Frontend Shell, Design System & Accessible Components**
- [ ] **Milestone 6: Event Onboarding, Budget UI, Timeline & Vendors**
- [ ] **Milestone 7: Proposal Diff Preview & Approval/Rejection Workflow**
- [ ] **Milestone 8: Full Automated Test Suite & Final Hardening**
