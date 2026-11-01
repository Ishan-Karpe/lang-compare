import type { ComparisonRow, Snippet } from '$lib/types';

export interface BridgeBadge {
	kind: 'similar' | 'differs' | 'same' | 'shift' | 'gotcha';
	note?: string;
	/** "<from> → <to>" as the note was written, which may be the reverse pair */
	direction?: string;
}

const NOTE_KINDS = { Same: 'same', Shift: 'shift', Gotcha: 'gotcha' } as const;

/** Table notes start with "Same:", "Shift:" or "Gotcha:", which set the badge. */
function parseNote(raw: string): Pick<BridgeBadge, 'kind' | 'note'> {
	const match = raw.match(/^(Same|Shift|Gotcha):\s*/);
	if (!match) return { kind: 'differs', note: raw };
	return {
		kind: NOTE_KINDS[match[1] as keyof typeof NOTE_KINDS],
		note: raw.slice(match[0].length)
	};
}

/**
 * Token-set Dice coefficient between two code snippets (0..1).
 * Cheap heuristic for "does this look like what I already know?".
 */
export function snippetSimilarity(a: string, b: string): number {
	const tokenize = (s: string) =>
		new Set(
			s
				.toLowerCase()
				.split(/[^a-z0-9_]+/)
				.filter((t) => t.length > 1)
		);
	const ta = tokenize(a);
	const tb = tokenize(b);
	if (ta.size === 0 || tb.size === 0) return 0;
	let common = 0;
	for (const t of ta) if (tb.has(t)) common++;
	return (2 * common) / (ta.size + tb.size);
}

const SIMILAR_THRESHOLD = 0.5;

/**
 * Badge for `target` relative to the user's home-language snippet.
 * A curated bridge note always wins, and a note written for this exact
 * direction beats the reverse pair; otherwise fall back to the similarity
 * heuristic. Returns null when target IS the home language.
 */
export function bridgeBadge(
	row: Pick<ComparisonRow, 'bridgeNotes'>,
	home: Snippet | undefined,
	target: Snippet
): BridgeBadge | null {
	if (!home || home.language === target.language) return null;

	const forward = row.bridgeNotes?.[`${home.language}->${target.language}`];
	if (forward) {
		return { ...parseNote(forward), direction: `${home.language} → ${target.language}` };
	}
	const reverse = row.bridgeNotes?.[`${target.language}->${home.language}`];
	if (reverse) {
		return { ...parseNote(reverse), direction: `${target.language} → ${home.language}` };
	}

	const sim = snippetSimilarity(home.contentRaw ?? '', target.contentRaw ?? '');
	return sim >= SIMILAR_THRESHOLD ? { kind: 'similar' } : { kind: 'differs' };
}
