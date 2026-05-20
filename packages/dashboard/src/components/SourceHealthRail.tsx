import type { SourceHealth } from '@ffr/shared';

const STATUS_STYLE: Record<string, string> = {
  LIVE: 'bg-green-900 text-green-300 border-green-700',
  BLOCKED: 'bg-red-900 text-red-300 border-red-700',
  STALE: 'bg-yellow-900 text-yellow-300 border-yellow-700',
};

export function SourceHealthRail({ sources }: { sources: SourceHealth[] }) {
  return (
    <div className="flex gap-3" role="list" aria-label="소스 상태">
      {sources.map((s) => (
        <div
          key={s.source}
          role="listitem"
          className={`rounded border px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[s.status] ?? ''}`}
        >
          <span>{s.source}</span>
          <span className="ml-2">{s.status}</span>
          <span className="ml-2 opacity-70">{s.reviewCount}건</span>
        </div>
      ))}
    </div>
  );
}
