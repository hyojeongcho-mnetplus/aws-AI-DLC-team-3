const BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  getIssues: () => request<import("@ffr/shared").ClusterSnapshot[]>("/issues"),
  getIssue: (id: string) =>
    request<{
      cluster: import("@ffr/shared").ClusterSnapshot;
      reviews: import("@ffr/shared").ProcessedReview[];
      actionBrief?: import("@ffr/shared").ActionBrief;
    }>(`/issues/${id}`),
  getHealth: () => request<import("@ffr/shared").SourceHealth[]>("/health"),
  regenerateAction: (id: string) =>
    request<import("@ffr/shared").ActionBrief>(`/actions/${id}`, {
      method: "POST",
    }),
};
