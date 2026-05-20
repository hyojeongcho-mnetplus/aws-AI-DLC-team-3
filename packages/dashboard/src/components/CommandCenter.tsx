import { useState, useCallback } from "react";
import { api } from "../lib/api";
import { usePolling } from "../hooks/usePolling";
import { ErrorScreen } from "./ErrorScreen";
import { SourceHealthRail } from "./SourceHealthRail";
import { RisingIssuesList } from "./RisingIssuesList";
import { IssueDetail } from "./IssueDetail";

function CommandLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-command-canvas p-6 text-slate-400">
      <div className="command-panel w-full max-w-lg p-6 text-center">
        <p className="command-label">Syncing command center</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">
          팬 프릭션 신호를 불러오는 중
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          리뷰 클러스터와 소스 상태를 동기화하고 있습니다.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden="true">
          <div className="h-2 rounded-full bg-red-500/60" />
          <div className="h-2 rounded-full bg-orange-500/50" />
          <div className="h-2 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export function CommandCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchIssues = useCallback(() => api.getIssues(), []);
  const fetchHealth = useCallback(() => api.getHealth(), []);

  const issues = usePolling(fetchIssues);
  const health = usePolling(fetchHealth);
  const issueCount = issues.data?.length ?? 0;
  const p1Count =
    issues.data?.filter((issue) => issue.severity === 1).length ?? 0;
  const selectedIssue = issues.data?.find(
    (issue) => issue.clusterId === selectedId,
  );

  if (issues.error)
    return <ErrorScreen error={issues.error} onRetry={issues.refetch} />;
  if (issues.loading) return <CommandLoading />;

  return (
    <main className="min-h-screen bg-command-canvas px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="command-panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="command-label">Mnet Plus operations</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Fan Friction Radar
                </h1>
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                  P1 {p1Count}건
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                공개 리뷰 신호를 severity-first 이슈 큐로 정리해 운영자가 즉시
                확인하고 대응할 수 있게 합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:min-w-[28rem]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">이슈 큐</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {issueCount}
                </p>
              </div>
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-3">
                <p className="text-xs text-red-300/80">긴급 P1</p>
                <p className="mt-1 text-2xl font-bold text-red-100">
                  {p1Count}
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:col-span-1">
                <p className="text-xs text-slate-500">선택됨</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                  {selectedIssue?.title ?? "대기 중"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-800 pt-4">
            {health.data ? (
              <SourceHealthRail sources={health.data} />
            ) : (
              <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-200">
                소스 상태 동기화 대기 중
                {health.error ? `: ${health.error}` : ""}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(20rem,0.92fr)_minmax(0,1.6fr)]">
          <section
            className="command-panel p-4"
            aria-labelledby="issue-queue-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="command-label">Triage queue</p>
                <h2
                  id="issue-queue-title"
                  className="mt-1 text-lg font-bold text-white"
                >
                  상승 이슈
                </h2>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
                severity 순
              </span>
            </div>
            <RisingIssuesList
              issues={issues.data ?? []}
              selectedId={selectedId ?? undefined}
              onSelect={setSelectedId}
            />
          </section>

          <section aria-label="선택한 이슈 상세">
            {selectedId ? (
              <IssueDetail
                clusterId={selectedId}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="command-panel flex min-h-[26rem] items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <p className="command-label">Awaiting selection</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">
                    이슈를 선택하세요
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    왼쪽 큐에서 P1/P2 이슈를 선택하면 증거 리뷰와 액션 브리프가
                    이 영역에 표시됩니다.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
