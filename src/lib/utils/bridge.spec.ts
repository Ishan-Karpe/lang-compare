import { describe, expect, it } from 'vitest';
import { bridgeBadge, snippetSimilarity } from './bridge';
import type { Snippet } from '$lib/types';

const snip = (language: string, contentRaw: string): Snippet => ({
	language,
	detailLevel: 'simple',
	contentHtml: '',
	contentRaw
});

describe('snippetSimilarity', () => {
	it('returns 1 for identical snippets', () => {
		expect(snippetSimilarity('let x = 10;', 'let x = 10;')).toBe(1);
	});

	it('returns 0 for empty input', () => {
		expect(snippetSimilarity('', 'let x = 10;')).toBe(0);
	});

	it('scores related snippets higher than unrelated ones', () => {
		const js = 'for (let i=0; i<3; i++) { console.log(i); }';
		const ts = 'for (let i=0; i<3; i++) { console.log(i); }';
		const rust = 'for i in 0..3 { println!("{}", i); }';
		expect(snippetSimilarity(js, ts)).toBeGreaterThan(snippetSimilarity(js, rust));
	});
});

describe('bridgeBadge', () => {
	const home = snip('Python 3.12', 'print("hi")');

	it('returns null without a home snippet', () => {
		expect(bridgeBadge({ bridgeNotes: {} }, undefined, snip('Rust', 'x'))).toBeNull();
	});

	it('returns null for the home language itself', () => {
		expect(bridgeBadge({ bridgeNotes: {} }, home, home)).toBeNull();
	});

	it('prefers a curated note (either direction) and marks it differs', () => {
		const row = { bridgeNotes: { 'Python 3.12->Rust': 'No GC.' } };
		const fwd = bridgeBadge(row, home, snip('Rust', 'println!("hi")'));
		expect(fwd).toEqual({ kind: 'differs', note: 'No GC.', direction: 'Python 3.12 → Rust' });

		const reverseRow = { bridgeNotes: { 'Rust->Python 3.12': 'GC instead.' } };
		const rev = bridgeBadge(reverseRow, home, snip('Rust', 'println!("hi")'));
		expect(rev?.note).toBe('GC instead.');
		expect(rev?.direction).toBe('Rust → Python 3.12');
	});

	it('prefers the note written for the learner direction', () => {
		const row = {
			bridgeNotes: { 'Rust->Python 3.12': 'Reverse.', 'Python 3.12->Rust': 'Forward.' }
		};
		expect(bridgeBadge(row, home, snip('Rust', 'x'))?.note).toBe('Forward.');
	});

	it('reads the badge kind from the note prefix', () => {
		const badge = (note: string) =>
			bridgeBadge({ bridgeNotes: { 'Python 3.12->Rust': note } }, home, snip('Rust', 'x'));
		expect(badge('Same: Alike.')).toMatchObject({ kind: 'same', note: 'Alike.' });
		expect(badge('Shift: New syntax.')).toMatchObject({ kind: 'shift', note: 'New syntax.' });
		expect(badge('Gotcha: Careful.')).toMatchObject({ kind: 'gotcha', note: 'Careful.' });
	});

	it('falls back to the similarity heuristic without a note', () => {
		const similar = bridgeBadge(
			{ bridgeNotes: {} },
			snip('JavaScript (ES6+)', 'let a = []; a.push(1);'),
			snip('TypeScript', 'let a: number[] = []; a.push(1);')
		);
		expect(similar?.kind).toBe('similar');

		const differs = bridgeBadge({ bridgeNotes: {} }, home, snip('C (C17)', 'printf("%d", x);'));
		expect(differs?.kind).toBe('differs');
	});
});
