declare module 'app-store-scraper' {
  interface ReviewResult {
    id: string | number;
    userName: string;
    userUrl: string;
    version: string;
    score: number;
    title: string;
    text: string;
    updated: string;
    url: string;
  }

  interface ReviewOptions {
    id?: number;
    appId?: string;
    country?: string;
    page?: number;
    sort?: number;
  }

  const sort: { RECENT: number; HELPFUL: number };
  function reviews(options: ReviewOptions): Promise<ReviewResult[]>;
  export default { reviews, sort };
}
