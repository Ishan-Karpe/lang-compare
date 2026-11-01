import { describe, expect, it } from 'vitest';
import comparisonData from './comparison-data.json';
import type { ComparisonRow } from '$lib/types';

const rows = comparisonData.rows as unknown as ComparisonRow[];
const PYTHON = 'Python 3.12';
const JAVA = 'Java (LTS)';
const snippet = (row: ComparisonRow, language: string) =>
	row.snippets.find((s) => s.language === language);

describe('learning content', () => {
	const RUST = 'Rust';
	it('has a classified bridge note on every row', () => {
		const unclassified = rows
			.filter((row) => !row.focus)
			.filter(
				(row) => !/^(Same|Shift|Gotcha): /.test(row.bridgeNotes?.[`${PYTHON}->${JAVA}`] ?? '')
			)
			.map((row) => row.feature);
		expect(unclassified).toEqual([]);
	});

	it('has a classified Rust note on every default-level row', () => {
		const unclassified = rows
			.filter((row) => row.categoryDetailLevel === 'simple')
			.filter(
				(row) => !/^(Same|Shift|Gotcha): /.test(row.bridgeNotes?.[`${PYTHON}->${RUST}`] ?? '')
			)
			.map((row) => row.feature);
		expect(unclassified).toEqual([]);
	});

	it('has an expected output for every auto-checked Rust exercise', () => {
		const missing = rows
			.filter((row) => snippet(row, RUST)?.runMode === 'browser')
			.filter((row) => snippet(row, RUST)?.verifiedOutput === undefined)
			.map((row) => row.feature);
		expect(missing).toEqual([]);
	});

	it('has required concepts and a worked example for every auto-checked Rust exercise', () => {
		const incomplete = rows
			.filter((row) => snippet(row, RUST)?.runMode === 'browser')
			.filter((row) => !row.requirements?.[RUST]?.length || !row.examples?.[RUST]?.raw)
			.map((row) => row.feature);
		expect(incomplete).toEqual([]);
	});

	it('has a real recorded run for every runnable Python and Java snippet', () => {
		const unverified = rows.flatMap((row) =>
			[PYTHON, JAVA, RUST]
				.map((language) => snippet(row, language))
				.filter((s) => s?.runMode && s.verifiedOutput === undefined)
				.map((s) => `${row.feature} [${s?.language}]`)
		);
		expect(unverified).toEqual([]);
	});

	it('teaches functions, classes and errors at the default detail level', () => {
		const simple = rows.filter((row) => row.categoryDetailLevel === 'simple').map((r) => r.feature);
		expect(simple).toEqual(
			expect.arrayContaining([
				'Function Definition',
				'OOP: Class/Struct',
				'Error Handling (Primary)'
			])
		);
	});

	it('marks no shell command as runnable', () => {
		const wrong = rows.flatMap((row) =>
			row.snippets.filter((s) => s.isShell && s.runMode).map(() => row.feature)
		);
		expect(wrong).toEqual([]);
	});
});
