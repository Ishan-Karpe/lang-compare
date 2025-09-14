// src/lib/types/index.ts
export interface ComparisonRow {
	category: string;
	categoryDetailLevel: 'simple' | 'detailed' | 'expert';
	feature: string;
	snippets: Snippet[];
}

export interface Snippet {
	language: string;
	detailLevel: 'simple' | 'detailed' | 'expert';
	contentHtml: string; // Pre-rendered HTML from Shiki
}
