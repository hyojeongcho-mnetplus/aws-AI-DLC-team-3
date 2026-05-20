import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => { mockFetch.mockReset(); });

describe('api', () => {
  it('getIssues returns parsed JSON', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([{ clusterId: '1' }]) });
    const result = await api.getIssues();
    expect(result).toEqual([{ clusterId: '1' }]);
    expect(mockFetch).toHaveBeenCalledWith('/api/issues', undefined);
  });

  it('getHealth calls correct endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await api.getHealth();
    expect(mockFetch).toHaveBeenCalledWith('/api/health', undefined);
  });

  it('regenerateAction sends POST', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ clusterId: 'abc' }) });
    await api.regenerateAction('abc');
    expect(mockFetch).toHaveBeenCalledWith('/api/actions/abc', { method: 'POST' });
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('server error') });
    await expect(api.getIssues()).rejects.toThrow(ApiError);
    await expect(api.getIssues()).rejects.toMatchObject({ status: 500, message: 'server error' });
  });
});
