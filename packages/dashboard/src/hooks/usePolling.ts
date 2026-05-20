import { useEffect, useRef, useState, useCallback } from 'react';

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = 30_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const retries = useRef(0);

  const execute = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      retries.current = 0;
    } catch (e) {
      retries.current++;
      if (retries.current >= 3) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    execute();
    const id = setInterval(() => {
      if (!document.hidden) execute();
    }, intervalMs);
    return () => clearInterval(id);
  }, [execute, intervalMs]);

  return { data, error, loading, refetch: execute };
}
