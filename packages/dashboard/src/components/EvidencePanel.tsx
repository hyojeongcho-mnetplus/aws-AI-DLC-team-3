import type { ProcessedReview } from "@ffr/shared";

function redactAuthor(author: string) {
  return author.length > 3 ? author.slice(0, 3) + "***" : author;
}

function truncateBody(body: string) {
  return body.length > 100 ? body.slice(0, 100) + "..." : body;
}

export function EvidencePanel({ reviews }: { reviews: ProcessedReview[] }) {
  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
      aria-labelledby="evidence-title"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="command-label">Evidence</p>
          <h3
            id="evidence-title"
            className="mt-1 text-base font-bold text-white"
          >
            증거 리뷰
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
          {reviews.length}개
        </span>
      </div>
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/45 p-4 text-sm leading-6 text-slate-400">
          이 클러스터에 연결된 증거 리뷰를 찾지 못했습니다. 최근 리뷰 수집일이나
          소스 상태를 확인하세요.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[0.68rem] font-semibold uppercase text-slate-300">
                  {r.source}
                </span>
                <span className="text-xs text-slate-500">
                  {redactAuthor(r.author)}
                </span>
                <span className="text-xs text-slate-500">{r.createdAt}</span>
              </div>
              <p className="font-medium leading-6 text-slate-200">
                {r.summary}
              </p>
              <p className="mt-2 border-l-2 border-slate-700 pl-3 text-xs leading-5 text-slate-500">
                {truncateBody(r.body)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
