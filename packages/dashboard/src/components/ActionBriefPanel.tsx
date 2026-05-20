import { useState } from "react";
import type { ActionBrief } from "@ffr/shared";
import { api } from "../lib/api";

const MODE_STYLE: Record<string, { className: string; label: string }> = {
  AI_ENHANCED: {
    className: "border-blue-500/50 bg-blue-500/15 text-blue-100",
    label: "AI ENHANCED",
  },
  DETERMINISTIC: {
    className: "border-slate-600 bg-slate-800 text-slate-200",
    label: "DETERMINISTIC",
  },
  NEEDS_REVIEW: {
    className: "border-orange-500/50 bg-orange-500/15 text-orange-100",
    label: "NEEDS REVIEW",
  },
};

interface Props {
  actionBrief?: ActionBrief;
  clusterId: string;
}

export function ActionBriefPanel({ actionBrief, clusterId }: Props) {
  const [brief, setBrief] = useState(actionBrief);
  const [loading, setLoading] = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const result = await api.regenerateAction(clusterId);
      setBrief(result);
    } finally {
      setLoading(false);
    }
  }

  if (!brief) {
    return (
      <section
        className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-4"
        aria-labelledby="action-brief-title"
      >
        <p className="command-label text-blue-300">Action</p>
        <h3
          id="action-brief-title"
          className="mt-1 text-base font-bold text-white"
        >
          액션 브리프 없음
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          선택한 이슈에 대한 담당팀별 대응 제안을 생성할 수 있습니다.
        </p>
        <button
          onClick={regenerate}
          disabled={loading}
          className="focus-command mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "생성 중..." : "액션 브리프 생성"}
        </button>
      </section>
    );
  }

  const mode = MODE_STYLE[brief.aiMode] ?? {
    className: "border-slate-600 bg-slate-800 text-slate-200",
    label: brief.aiMode,
  };

  return (
    <section
      className="rounded-2xl border border-blue-900/40 bg-blue-950/15 p-4"
      aria-labelledby="action-brief-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="command-label text-blue-300">Recommended action</p>
          <h3
            id="action-brief-title"
            className="mt-1 text-base font-bold text-white"
          >
            액션 브리프
          </h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${mode.className}`}
        >
          {mode.label}
        </span>
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/55 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Owner
        </p>
        <p className="mt-1 text-sm font-bold text-blue-100">{brief.owner}</p>
      </div>
      <div className="mt-3 space-y-3 text-sm leading-6">
        <p className="text-slate-200">{brief.summary}</p>
        <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            제안
          </p>
          <p className="mt-1 text-slate-100">{brief.suggestedAction}</p>
        </div>
      </div>
      <button
        onClick={regenerate}
        disabled={loading}
        className="focus-command mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "재생성 중..." : "액션 브리프 재생성"}
      </button>
    </section>
  );
}
