import { useEffect, useState } from "react";
import type {
  ClusterSnapshot,
  ProcessedReview,
  ActionBrief,
} from "@ffr/shared";
import { api } from "../lib/api";
import { EvidencePanel } from "./EvidencePanel";
import { ActionBriefPanel } from "./ActionBriefPanel";

interface Props {
  clusterId: string;
  onClose: () => void;
}

interface IssueData {
  cluster: ClusterSnapshot;
  reviews: ProcessedReview[];
  actionBrief?: ActionBrief;
}

function severityLabel(severity: number) {
  if (severity === 1) return "P1 긴급 대응";
  if (severity === 2) return "P2 우선 확인";
  if (severity === 3) return "P3 관찰";
  return `P${severity} 참고`;
}

export function IssueDetail({ clusterId, onClose }: Props) {
  const [data, setData] = useState<IssueData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api
      .getIssue(clusterId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [clusterId]);

  if (error) {
    return (
      <div className="command-panel p-5 text-sm text-red-200">
        <p className="command-label text-red-300">Detail load failed</p>
        <p className="mt-2">로드 실패: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="command-panel p-6 text-sm text-slate-400">
        <p className="command-label">Loading detail</p>
        <p className="mt-2">
          선택한 이슈의 증거와 액션 브리프를 불러오는 중...
        </p>
      </div>
    );
  }

  const { cluster, reviews } = data;
  const urgent = cluster.severity === 1;

  return (
    <article
      className={`command-panel overflow-hidden ${urgent ? "shadow-urgent" : ""}`}
    >
      <div className="border-b border-slate-800 bg-slate-950/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="command-label">Selected issue</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              {cluster.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="focus-command rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:text-white"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full border px-3 py-1 font-bold ${urgent ? "border-red-500/50 bg-red-500/15 text-red-100" : "border-orange-500/40 bg-orange-500/10 text-orange-100"}`}
          >
            {severityLabel(cluster.severity)}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
            {cluster.category}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
            {cluster.issueType}
          </span>
          {cluster.errorLevel && (
            <span className="rounded-full border border-red-700/60 bg-red-950 px-3 py-1 text-red-200">
              Error L{cluster.errorLevel}
            </span>
          )}
          <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
            증거 {cluster.reviewCount}건
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <EvidencePanel reviews={reviews} />
        <ActionBriefPanel
          actionBrief={data.actionBrief}
          clusterId={clusterId}
        />
      </div>
    </article>
  );
}
