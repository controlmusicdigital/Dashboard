export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface NewsResult {
  items: NewsItem[];
  source: "gemini" | "claude" | "mock";
  generatedAt: string;
  note?: string;
}
