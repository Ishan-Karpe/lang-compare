import type { ComparisonRow, Snippet } from '$lib/types';
import { slugify } from './slugify';

type DetailLevel = 'simple' | 'detailed' | 'expert';

const LEVEL_ORDER: DetailLevel[] = ['simple', 'detailed', 'expert'];

export function pairKey(home: string, target: string): string {
	return `${home}->${target}`;
}

/** The language being learned: the first visible language that isn't the home language. */
export function learningTarget(home: string | null, visible: string[]): string | null {
	if (!home) return null;
	return visible.find((lang) => lang !== home) ?? null;
}

/**
 * Languages whose runners may be active. While learning that's the home and
 * target languages only; otherwise it's whatever is on screen.
 */
export function runnerLanguages(home: string | null, visible: string[]): string[] {
	if (!home) return visible;
	const target = learningTarget(home, visible);
	return target ? [home, target] : [home];
}

/**
 * Visible languages after the home language changes. The language being learned
 * stays the same, unless the new home language is that language: then they swap.
 */
export function visibleAfterHomeChange(
	previous: string | null,
	next: string,
	visible: string[]
): string[] {
	if (!previous || previous === next) return visible;
	if (learningTarget(previous, visible) === next) {
		return [previous, ...visible.filter((l) => l !== previous)];
	}
	const remaining = visible.filter((l) => l !== previous);
	return remaining.length > 0 ? remaining : visible;
}

export function nextDetailLevel(level: DetailLevel): DetailLevel | null {
	return LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1] ?? null;
}

/** Features at the current detail level that the target language has content for, in table order. */
export function lessonFeatures(
	rows: ComparisonRow[],
	level: DetailLevel,
	target: string
): { slug: string; feature: string }[] {
	const maxLevel = LEVEL_ORDER.indexOf(level);
	return rows
		.filter(
			(row) =>
				LEVEL_ORDER.indexOf(row.categoryDetailLevel) <= maxLevel &&
				row.snippets.some((s) => s.language === target && s.contentHtml)
		)
		.map((row) => ({ slug: slugify(row.feature), feature: row.feature }));
}

/** A `focus` row only appears when its language is selected. An empty selection means all languages. */
export function rowVisible(
	row: Pick<ComparisonRow, 'focus'>,
	visible: string[],
	home: string | null = null
): boolean {
	return !row.focus || visible.length === 0 || visible.includes(row.focus) || row.focus === home;
}

/**
 * How a learner practices a snippet. Rust attempts are compiled and graded
 * automatically; other languages are self-graded. Null means read-only: prose,
 * terminal commands, or Rust that can't be checked remotely.
 */
export function practiceMode(snippet: Snippet): 'auto' | 'self' | null {
	if (!snippet.contentRaw || snippet.isShell) return null;
	if (snippet.language === 'Rust') return snippet.runMode === 'browser' ? 'auto' : null;
	return 'self';
}

export interface UpcomingLesson {
	slug: string;
	feature: string;
	isReview: boolean;
	isRetest: boolean;
}

/**
 * The next topic to study. Retests that are due come first, so spacing stays on
 * schedule, then untouched topics, then whatever was skipped for review.
 */
export function nextLesson(
	lessons: { slug: string; feature: string }[],
	learned: string[],
	review: string[],
	due: string[] = []
): UpcomingLesson | null {
	const retest = lessons.find((l) => due.includes(l.slug));
	if (retest) return { ...retest, isReview: false, isRetest: true };
	const open = lessons.filter((l) => !learned.includes(l.slug));
	const fresh = open.find((l) => !review.includes(l.slug));
	if (fresh) return { ...fresh, isReview: false, isRetest: false };
	return open.length > 0 ? { ...open[0], isReview: true, isRetest: false } : null;
}

export function lessonLabel(lesson: Pick<UpcomingLesson, 'feature' | 'isReview' | 'isRetest'>) {
	const verb = lesson.isRetest ? 'Retest' : lesson.isReview ? 'Review' : 'Next';
	return `${verb}: ${lesson.feature}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days until the next retest. A topic retires after passing the last one. */
export const RETEST_INTERVAL_DAYS = [1, 3, 7, 21];

export interface RetestEntry {
	stage: number;
	due: number;
}

/**
 * The schedule after a pass. A first pass, or any pass with the answer shown, starts
 * at the shortest interval. A clean retest moves on, and null means it's retired.
 */
export function nextRetest(
	current: RetestEntry | undefined,
	now: number,
	helped: boolean
): RetestEntry | null {
	const stage = !current || helped ? 0 : current.stage + 1;
	if (stage >= RETEST_INTERVAL_DAYS.length) return null;
	return { stage, due: now + RETEST_INTERVAL_DAYS[stage] * DAY_MS };
}

export function dueSlugs(schedule: Record<string, RetestEntry> = {}, now: number): string[] {
	return Object.entries(schedule)
		.filter(([, entry]) => entry.due <= now)
		.map(([slug]) => slug);
}

export function retestPostponed(entry: RetestEntry, now: number): RetestEntry {
	return { ...entry, due: now + DAY_MS };
}

/**
 * The first real error in compiler output, so one mistake doesn't bury a beginner in
 * follow-on errors. Output with no such error, such as a panic, is kept whole.
 */
export function firstCompilerError(stderr: string): { first: string; total: number } {
	const errors = stderr
		.split(/\n\s*\n/)
		.map((block) => block.trim())
		.filter((block) => /^error/.test(block) && !/^error: (could not compile|aborting)/.test(block));
	return { first: errors[0] ?? stderr, total: errors.length };
}

export type AttemptGrade = 'pass' | 'wrong-output' | 'missing-concept' | 'failed' | 'unreachable';

/**
 * An attempt passes only if it ran, printed the expected output, and used the
 * topic's required concepts.
 */
export function gradeAttempt(
	result: { ok: boolean; output: string; unreachable?: boolean },
	expected: string,
	missingCount = 0
): AttemptGrade {
	if (result.unreachable) return 'unreachable';
	if (!result.ok) return 'failed';
	if (result.output.trimEnd() !== expected.trimEnd()) return 'wrong-output';
	return missingCount > 0 ? 'missing-concept' : 'pass';
}

export function scrollToFeature(slug: string) {
	document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth' });
}

/** Whitespace-insensitive match, so spacing and line breaks don't count against an attempt. */
export function matchesReference(attempt: string, reference: string): boolean {
	const normalize = (code: string) => code.replace(/\s+/g, '');
	return normalize(attempt).length > 0 && normalize(attempt) === normalize(reference);
}
