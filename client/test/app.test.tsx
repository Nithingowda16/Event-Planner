import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../src/App.js';

// Mock global fetch for health check
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        status: 'ok',
        service: 'celebrateos-server',
        timestamp: new Date().toISOString(),
        uptimeSeconds: 10,
      }),
  })
);

describe('Client Foundation App Component', () => {
  it('renders the CelebrateOS brand and milestone title', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /celebrateos/i })).toBeDefined();
    expect(screen.getByText(/Milestone 0: Monorepo Foundation & Workspace Scaffolding/i)).toBeDefined();
    expect(screen.getByText(/Zero Key Leakage/i)).toBeDefined();
    expect(screen.getByText(/Authoritative Backend/i)).toBeDefined();

    // Await async fetch state resolution
    await waitFor(() => {
      expect(screen.getByText(/Connected to celebrateos-server/i)).toBeDefined();
    });
  });
});
