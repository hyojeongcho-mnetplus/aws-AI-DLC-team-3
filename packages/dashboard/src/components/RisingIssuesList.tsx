import type { ClusterSnapshot } from '@ffr/shared';

const SEVERITY_BORDER: Record<number, string> = {
  1: 'border-l-red-500',
  2: 'border-l-orange-500',
  3: 'border-l-yellow-500',
  4: 'border-l-gray-500',
};

interface Props {
  issues: ClusterSnapshot[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function RisingIssuesList({ issues, selectedId, onSelect }: Props) {
  const sorted = [...issues].sort((a, b) => a.severity - b.severity);

  return (
    <div className="space-y-2" role="list" aria-label="이슈 목록">
      {sorted.map((issue) => (
        <button
          key={issue.clusterId}
          role="listitem"
          onClick={() => onSelect(issue.clusterId)}
          className={`w-full rounded border-l-4 ${SEVERITY_BORDER[issue.severity] ?? 'border-l-gray-500'} border border-gray-800 bg-gray-900 p-3 text-left transition hover:bg-gray-800 ${selectedId === issue.clusterId ? 'ring-1 ring-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-100">{issue.title}</span>
            <span className="text-xs text-gray-500">{issue.reviewCount}건</span>
          </div>
          <div className="mt-1 flex gap-2 text-xs text-gray-400">
            <span>{issue.category}</span>
            <span>{issue.issueType}</span>
            {issue.errorLevel && <span className="text-red-400">P{issue.errorLevel}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
