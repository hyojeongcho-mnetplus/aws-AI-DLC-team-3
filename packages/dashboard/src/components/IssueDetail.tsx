import { useEffect, useState } from 'react';
import type { ClusterSnapshot, ProcessedReview, ActionBrief } from '@ffr/shared';
import { api } from '../lib/api';
import { EvidencePanel } from './EvidencePanel';
import { ActionBriefPanel } from './ActionBriefPanel';

interface Props {
  clusterId: string;
  onClose: () => void;
}

interface IssueData {
  cluster: ClusterSnapshot;
  reviews: ProcessedReview[];
  actionBrief?: ActionBrief;
}

export function IssueDetail({ clusterId, onClose }: Props) {
  const [data, setData] = useState<IssueData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getIssue(clusterId).then(setData).catch((e) => setError(e.message));
  }, [clusterId]);

  if (error) return <div className="p-4 text-red-400 text-sm">로드 실패: {error}</div>;
  if (!data) return <div className="p-4 text-gray-500 text-sm">로딩 중...</div>;

  const { cluster, reviews } = data;

  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-100">{cluster.title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300" aria-label="닫기">✕</button>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="rounded bg-gray-700 px-2 py-0.5">{cluster.category}</span>
        <span className="rounded bg-gray-700 px-2 py-0.5">{cluster.issueType}</span>
        {cluster.errorLevel && <span className="rounded bg-red-900 px-2 py-0.5 text-red-300">P{cluster.errorLevel}</span>}
        <span className="text-gray-500">{cluster.reviewCount}건</span>
      </div>
      <EvidencePanel reviews={reviews} />
      <ActionBriefPanel actionBrief={data.actionBrief} clusterId={clusterId} />
    </div>
  );
}
