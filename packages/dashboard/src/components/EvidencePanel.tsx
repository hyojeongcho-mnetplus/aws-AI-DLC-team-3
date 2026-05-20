import type { ProcessedReview } from '@ffr/shared';

function redactAuthor(author: string) {
  return author.length > 3 ? author.slice(0, 3) + '***' : author;
}

function truncateBody(body: string) {
  return body.length > 100 ? body.slice(0, 100) + '...' : body;
}

export function EvidencePanel({ reviews }: { reviews: ProcessedReview[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400">증거 리뷰</h3>
      {reviews.map((r) => (
        <div key={r.id} className="rounded border border-gray-800 bg-gray-900 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs">{r.source}</span>
            <span className="text-xs text-gray-500">{redactAuthor(r.author)}</span>
            <span className="text-xs text-gray-500">{r.createdAt}</span>
          </div>
          <p className="text-gray-300">{r.summary}</p>
          <p className="mt-1 text-xs text-gray-500">{truncateBody(r.body)}</p>
        </div>
      ))}
    </div>
  );
}
