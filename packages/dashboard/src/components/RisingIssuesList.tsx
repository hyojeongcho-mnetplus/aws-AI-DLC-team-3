import type { ClusterSnapshot } from "@ffr/shared";

const SEVERITY_STYLE: Record<
  number,
  { border: string; badge: string; label: string; ring: string }
> = {
  1: {
    border: "border-l-severity-p1",
    badge: "border-red-500/50 bg-red-500/15 text-red-100",
    label: "P1 긴급",
    ring: "shadow-urgent",
  },
  2: {
    border: "border-l-severity-p2",
    badge: "border-orange-500/50 bg-orange-500/15 text-orange-100",
    label: "P2 주의",
    ring: "",
  },
  3: {
    border: "border-l-severity-p3",
    badge: "border-yellow-500/50 bg-yellow-500/15 text-yellow-100",
    label: "P3 관찰",
    ring: "",
  },
  4: {
    border: "border-l-severity-p4",
    badge: "border-slate-500/50 bg-slate-500/10 text-slate-200",
    label: "P4 참고",
    ring: "",
  },
};

interface Props {
  issues: ClusterSnapshot[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function RisingIssuesList({ issues, selectedId, onSelect }: Props) {
  const sorted = [...issues].sort((a, b) => a.severity - b.severity);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm text-slate-400">
        현재 상승 이슈가 없습니다. 다음 폴링 주기에서 새 리뷰 신호를 다시
        확인합니다.
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="이슈 목록">
      {sorted.map((issue) => {
        const style = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE[4];
        const selected = selectedId === issue.clusterId;
        return (
          <button
            key={issue.clusterId}
            type="button"
            role="listitem"
            onClick={() => onSelect(issue.clusterId)}
            className={`focus-command w-full rounded-2xl border border-slate-800 border-l-4 ${style.border} bg-slate-950/65 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900/80 ${style.ring} ${selected ? "ring-1 ring-blue-400/80" : ""}`}
            aria-current={selected ? "true" : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${style.badge}`}
              >
                {style.label}
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400">
                {issue.reviewCount}건
              </span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-5 text-slate-50">
              {issue.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-md bg-slate-800/80 px-2 py-1">
                {issue.category}
              </span>
              <span className="rounded-md bg-slate-800/80 px-2 py-1">
                {issue.issueType}
              </span>
              {issue.errorLevel && (
                <span className="rounded-md bg-red-950 px-2 py-1 text-red-200">
                  Error L{issue.errorLevel}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
