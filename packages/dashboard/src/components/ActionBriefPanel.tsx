import { useState } from 'react';
import type { ActionBrief } from '@ffr/shared';
import { api } from '../lib/api';

const MODE_STYLE: Record<string, string> = {
  AI_ENHANCED: 'bg-blue-900 text-blue-300',
  DETERMINISTIC: 'bg-gray-700 text-gray-300',
  NEEDS_REVIEW: 'bg-orange-900 text-orange-300',
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
      <div className="rounded border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-500">액션 브리프 없음</p>
        <button onClick={regenerate} disabled={loading} className="mt-2 rounded bg-blue-700 px-3 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50">
          {loading ? '생성 중...' : '생성'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-400">액션 브리프</h3>
        <span className={`rounded px-1.5 py-0.5 text-xs ${MODE_STYLE[brief.aiMode] ?? ''}`}>{brief.aiMode}</span>
      </div>
      <p className="text-xs text-gray-500">담당: {brief.owner}</p>
      <p className="text-sm text-gray-200">{brief.summary}</p>
      <p className="text-sm text-gray-300">제안: {brief.suggestedAction}</p>
      <button onClick={regenerate} disabled={loading} className="rounded bg-blue-700 px-3 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50">
        {loading ? '재생성 중...' : '재생성'}
      </button>
    </div>
  );
}
