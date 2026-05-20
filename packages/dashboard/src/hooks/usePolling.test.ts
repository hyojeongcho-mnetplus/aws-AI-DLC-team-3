import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fetches data on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue(['data']);
    const { result } = renderHook(() => usePolling(fetcher, 30_000));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(['data']);
    expect(result.current.error).toBeNull();
  });

  it('polls at specified interval', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    renderHook(() => usePolling(fetcher, 5_000));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('sets error after 3 consecutive failures', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePolling(fetcher, 1_000));

    // 1st call (mount)
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    // 2nd call
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    // 3rd call — retries >= 3
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });

    expect(result.current.error).toBe('fail');
  });

  it('skips polling when document is hidden', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    renderHook(() => usePolling(fetcher, 5_000));

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
