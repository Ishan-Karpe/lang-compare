import { describe, expect, it } from 'vitest';
import type { ComparisonRow } from '$lib/types';
import {
	lessonFeatures,
	learningTarget,
	matchesReference,
	dueSlugs,
	firstCompilerError,
	gradeAttempt,
	lessonLabel,
	nextRetest,
	RETEST_INTERVAL_DAYS,
	nextDetailLevel,
	nextLesson,
	practiceMode,
	rowVisible,
	runnerLanguages,
	visibleAfterHomeChange
} from './learning';

const row = (
	feature: string,
	categoryDetailLevel: ComparisonRow['categoryDetailLevel'],
	languages: string[]
): ComparisonRow => ({
	category: 'Category',
	categoryDetailLevel,
	feature,
	snippets: languages.map((language) => ({ language, detailLevel: 'simple', contentHtml: 'x' }))
});

describe('learningTarget', () => {
	it('skips the home language', () => {
		expect(learningTarget('Python 3.12', ['Python 3.12', 'Java (LTS)'])).toBe('Java (LTS)');
	});

	it('is null without a home language or another visible language', () => {
		expect(learningTarget(null, ['Java (LTS)'])).toBeNull();
		expect(learningTarget('Python 3.12', ['Python 3.12'])).toBeNull();
	});
});

describe('runnerLanguages', () => {
	const visible = ['Python 3.12', 'Java (LTS)', 'TypeScript', 'Rust'];

	it('keeps only the home and target languages while learning', () => {
		expect(runnerLanguages('Python 3.12', visible)).toEqual(['Python 3.12', 'Java (LTS)']);
	});

	it('swaps when another language moves to the front', () => {
		const swapped = ['TypeScript', 'Python 3.12', 'Java (LTS)'];
		expect(runnerLanguages('Python 3.12', swapped)).toEqual(['Python 3.12', 'TypeScript']);
	});

	it('uses the visible languages when not learning', () => {
		expect(runnerLanguages(null, visible)).toEqual(visible);
	});

	it('keeps the home language when nothing else is visible', () => {
		expect(runnerLanguages('Python 3.12', ['Python 3.12'])).toEqual(['Python 3.12']);
	});
});

describe('visibleAfterHomeChange', () => {
	const visible = ['Python 3.12', 'Java (LTS)'];
	const targetAfter = (next: string) =>
		learningTarget(next, visibleAfterHomeChange('Python 3.12', next, visible));

	it('keeps the language being learned', () => {
		expect(targetAfter('Rust')).toBe('Java (LTS)');
	});

	it('swaps when the new home language was the target', () => {
		expect(targetAfter('Java (LTS)')).toBe('Python 3.12');
	});

	it('leaves the list alone when there was no home language', () => {
		expect(visibleAfterHomeChange(null, 'Rust', visible)).toEqual(visible);
	});
});

describe('lessonFeatures', () => {
	const rows = [
		row('Stdout', 'simple', ['Java (LTS)']),
		row('Lambdas', 'detailed', ['Java (LTS)']),
		row('Macros', 'simple', ['Rust'])
	];

	it('includes lower levels and excludes higher ones', () => {
		const slugs = (level: 'simple' | 'detailed') =>
			lessonFeatures(rows, level, 'Java (LTS)').map((f) => f.slug);
		expect(slugs('simple')).toEqual(['stdout']);
		expect(slugs('detailed')).toEqual(['stdout', 'lambdas']);
	});

	it('leaves out features with no content for the target', () => {
		expect(lessonFeatures(rows, 'simple', 'Rust').map((f) => f.slug)).toEqual(['macros']);
	});
});

describe('nextDetailLevel', () => {
	it('stops after expert', () => {
		expect(nextDetailLevel('simple')).toBe('detailed');
		expect(nextDetailLevel('expert')).toBeNull();
	});
});

describe('matchesReference', () => {
	it('ignores whitespace', () => {
		expect(matchesReference('int x=5;', 'int x = 5;')).toBe(true);
	});

	it('rejects different code and empty attempts', () => {
		expect(matchesReference('int y = 5;', 'int x = 5;')).toBe(false);
		expect(matchesReference('  ', 'int x = 5;')).toBe(false);
	});
});

describe('nextLesson', () => {
	const lessons = [
		{ slug: 'a', feature: 'A' },
		{ slug: 'b', feature: 'B' }
	];

	it('moves past skipped topics', () => {
		expect(nextLesson(lessons, [], ['a'])).toMatchObject({ slug: 'b', isReview: false });
	});

	it('returns to skipped topics once nothing new is left', () => {
		expect(nextLesson(lessons, ['b'], ['a'])).toMatchObject({ slug: 'a', isReview: true });
	});

	it('is null when everything is learned', () => {
		expect(nextLesson(lessons, ['a', 'b'], [])).toBeNull();
	});
});

describe('gradeAttempt', () => {
	it('passes only on a successful run with the expected output', () => {
		expect(gradeAttempt({ ok: true, output: 'hi' }, 'hi')).toBe('pass');
		expect(gradeAttempt({ ok: true, output: 'bye' }, 'hi')).toBe('wrong-output');
		expect(gradeAttempt({ ok: false, output: 'hi' }, 'hi')).toBe('failed');
	});

	it('rejects the right output without the required concepts', () => {
		expect(gradeAttempt({ ok: true, output: 'hi' }, 'hi', 1)).toBe('missing-concept');
	});

	it('never grades a run that did not happen', () => {
		expect(gradeAttempt({ ok: false, output: '', unreachable: true }, '')).toBe('unreachable');
	});
});

describe('practiceMode', () => {
	const snip = (language: string, extra = {}) => ({
		language,
		detailLevel: 'simple',
		contentHtml: 'x',
		contentRaw: 'code',
		...extra
	});

	it('auto-checks runnable Rust and nothing else', () => {
		expect(practiceMode(snip('Rust', { runMode: 'browser' }))).toBe('auto');
		expect(practiceMode(snip('Rust', { runMode: 'local' }))).toBeNull();
		expect(practiceMode(snip('Rust'))).toBeNull();
		expect(practiceMode(snip('Java (LTS)', { runMode: 'browser' }))).toBe('self');
	});

	it('is read-only for commands and prose', () => {
		expect(practiceMode(snip('Rust', { isShell: true, runMode: 'browser' }))).toBeNull();
		expect(practiceMode(snip('Java (LTS)', { contentRaw: '' }))).toBeNull();
	});
});

describe('rowVisible', () => {
	it('shows a focus row only when its language is selected', () => {
		expect(rowVisible({ focus: 'Rust' }, ['Python 3.12', 'Java (LTS)'])).toBe(false);
		expect(rowVisible({ focus: 'Rust' }, ['Python 3.12', 'Rust'])).toBe(true);
		expect(rowVisible({ focus: 'Rust' }, ['Python 3.12'], 'Rust')).toBe(true);
		expect(rowVisible({}, ['Java (LTS)'])).toBe(true);
	});
});

describe('retests', () => {
	const NOW = 1_000_000;
	const DAY = 24 * 60 * 60 * 1000;

	it('schedules a first pass for tomorrow', () => {
		expect(nextRetest(undefined, NOW, false)).toEqual({ stage: 0, due: NOW + DAY });
	});

	it('spaces clean retests further apart, then retires the topic', () => {
		expect(nextRetest({ stage: 0, due: 0 }, NOW, false)).toEqual({ stage: 1, due: NOW + 3 * DAY });
		const last = RETEST_INTERVAL_DAYS.length - 1;
		expect(nextRetest({ stage: last, due: 0 }, NOW, false)).toBeNull();
	});

	it('starts over when the answer was shown', () => {
		expect(nextRetest({ stage: 2, due: 0 }, NOW, true)).toEqual({ stage: 0, due: NOW + DAY });
	});

	it('finds what is due', () => {
		const schedule = { a: { stage: 0, due: NOW }, b: { stage: 0, due: NOW + 1 } };
		expect(dueSlugs(schedule, NOW)).toEqual(['a']);
		expect(dueSlugs(undefined, NOW)).toEqual([]);
	});

	it('puts due retests ahead of new topics', () => {
		const lessons = [
			{ slug: 'a', feature: 'A' },
			{ slug: 'b', feature: 'B' }
		];
		const next = nextLesson(lessons, ['b'], [], ['b']);
		expect(next).toMatchObject({ slug: 'b', isRetest: true });
		expect(next && lessonLabel(next)).toBe('Retest: B');
	});
});

describe('firstCompilerError', () => {
	const output = [
		'warning: unused\n --> a.rs',
		'error[E0425]: first\n --> a.rs:1',
		'error[E0599]: second\n --> a.rs:2',
		'For more information about this error, try `rustc --explain E0425`.\nerror: could not compile `x` due to 2 previous errors'
	].join('\n\n');

	it('keeps only the first real error and counts them', () => {
		expect(firstCompilerError(output)).toEqual({
			first: 'error[E0425]: first\n --> a.rs:1',
			total: 2
		});
	});

	it('keeps other output whole, such as a panic', () => {
		const panic = "thread 'main' panicked at src/main.rs:2:5";
		expect(firstCompilerError(panic)).toEqual({ first: panic, total: 0 });
	});
});
