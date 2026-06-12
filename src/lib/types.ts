export interface Snippet {
	language: string;
	detailLevel: string;
	contentHtml: string;
	contentRaw?: string;
}

export interface ComparisonRow {
	category: string;
	categoryDetailLevel: 'simple' | 'detailed' | 'expert';
	feature: string;
	snippets: Snippet[];
	/** Bridge Mode notes keyed by "<homeLanguage>-><targetLanguage>" */
	bridgeNotes?: Record<string, string>;
}
