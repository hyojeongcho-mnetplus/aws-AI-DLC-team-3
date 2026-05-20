import type { SourceHealth } from "@ffr/shared";

const STATUS_STYLE: Record<string, { className: string; label: string }> = {
  LIVE: {
    className: "border-green-500/40 bg-green-500/15 text-green-100",
    label: "정상",
  },
  BLOCKED: {
    className: "border-red-500/40 bg-red-500/15 text-red-100",
    label: "차단",
  },
  STALE: {
    className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-100",
    label: "지연",
  },
};

export function SourceHealthRail({ sources }: { sources: SourceHealth[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="소스 상태">
      {sources.map((s) => {
        const status = STATUS_STYLE[s.status] ?? {
          className: "border-slate-600 bg-slate-800 text-slate-200",
          label: "확인 필요",
        };
        return (
          <div
            key={s.source}
            role="listitem"
            className={`rounded-xl border px-3 py-2 text-xs font-medium ${status.className}`}
            title={s.errorMessage}
          >
            <span className="font-bold uppercase tracking-wide">
              {s.source}
            </span>
            <span className="ml-2">{s.status}</span>
            <span className="ml-1 opacity-75">{status.label}</span>
            <span className="ml-2 opacity-75">{s.reviewCount}건</span>
          </div>
        );
      })}
    </div>
  );
}
