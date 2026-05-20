import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fetches data on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue(['data']);
    const { result } = renderHook(() => usePolling(fetcher, 30_000));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['data']);
    expect(result.current.error).toBeNull();
  });

  it('polls at specified interval', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    renderHook(() => usePolling(fetcher, 5_000));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('sets error after 3 consecutive failures', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePolling(fetcher, 1_000));

    await waitFor(() => expect(result.current.loading).toBe(false));
    // 1st failure — no error yet (retries.current = 1, threshold not met on first call since >=3 needed)
    // Actually first call: retries becomes 1, not >=3 so no error
    // We need 3 failures total
    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => { vi.advanceTimersByTime(1_000); });

    await waitFor(() => expect(result.current.error).toBe('fail'));
  });

  it('skips polling when document is hidden', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    renderHook(() => usePolling(fetcher, 5_000));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(1); // not called again

    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    await act(async () => { vi.advanceTimersByTime(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
