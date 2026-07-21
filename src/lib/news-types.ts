import { NewsCategory } from "./news-sources";

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  publishedAtMs?: number;
  category?: NewsCategory;
}

export interface NewsResult {
  items: NewsItem[];
  source: "sites" | "mock";
  generatedAt: string;
  note?: string;
}
