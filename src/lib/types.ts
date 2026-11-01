export interface Snippet {
	language: string;
	detailLevel: string;
	contentHtml: string;
	contentRaw?: string;
	/** Set by a `<!-- run -->` (browser) or `<!-- run:local -->` table cell marker */
	runMode?: 'browser' | 'local' | null;
	/** Set by a `<!-- shell -->` table cell marker: terminal commands, not program code */
	isShell?: boolean;
	/** Real stdout recorded by `npm run verify:snippets` for exactly this code */
	verifiedOutput?: string;
}

export interface ComparisonRow {
	category: string;
	categoryDetailLevel: 'simple' | 'detailed' | 'expert';
	feature: string;
	snippets: Snippet[];
	/** Bridge Mode notes (HTML) keyed by "<homeLanguage>-><targetLanguage>" */
	bridgeNotes?: Record<string, string>;
	/** "Fix this" exercises keyed by language, from a `Fix This: <Language>` column */
	exercises?: Record<string, { errorCode: string; starter: string }>;
	/** Concepts an attempt must use, by language. Each group needs one of its alternatives */
	requirements?: Record<string, string[][]>;
	/** Worked examples shown before an attempt, by language */
	examples?: Record<string, { raw: string; html: string }>;
	/** Set by `<!-- focus:<Language> -->`: the row only appears when that language is selected */
	focus?: string;
}
