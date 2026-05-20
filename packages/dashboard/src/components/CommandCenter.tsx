import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { usePolling } from '../hooks/usePolling';
import { ErrorScreen } from './ErrorScreen';
import { SourceHealthRail } from './SourceHealthRail';
import { RisingIssuesList } from './RisingIssuesList';
import { IssueDetail } from './IssueDetail';

export function CommandCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchIssues = useCallback(() => api.getIssues(), []);
  const fetchHealth = useCallback(() => api.getHealth(), []);

  const issues = usePolling(fetchIssues);
  const health = usePolling(fetchHealth);

  if (issues.error) return <ErrorScreen error={issues.error} onRetry={issues.refetch} />;
  if (issues.loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Fan Friction Radar</h1>
        {health.data && <SourceHealthRail sources={health.data} />}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RisingIssuesList
            issues={issues.data ?? []}
            selectedId={selectedId ?? undefined}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-2">
          {selectedId ? (
            <IssueDetail clusterId={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 text-gray-500">
              이슈를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
