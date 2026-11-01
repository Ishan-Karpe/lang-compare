import { persisted } from 'svelte-persisted-store';
import { derived, get, writable } from 'svelte/store';
import {
	nextRetest,
	retestPostponed,
	runnerLanguages,
	visibleAfterHomeChange,
	type RetestEntry
} from '$lib/utils/learning';

export const theme = persisted('theme', 'dark');

// Detail level is session-only, not persisted
export type DetailLevel = 'simple' | 'detailed' | 'expert';
export const detailLevel = writable<DetailLevel>('simple');

/**
 * visibleLanguages - persisted array of language names the user wants to see
 * Stored as an ordered array (column order). Default is empty array; UI will
 * initialize it to the full language list on first use.
 */
export const visibleLanguages = persisted<string[]>('visibleLanguages', []);

/**
 * Bridge Mode: the language the user already knows. null = Bridge Mode off.
 * When set, the home language is pinned first in every feature card and other
 * languages get similarity badges relative to it.
 */
export const homeLanguage = persisted<string | null>('homeLanguage', null);

/** Languages whose runners may be active. Empty means nothing is selected yet. */
export const activeRunnerLanguages = derived(
	[homeLanguage, visibleLanguages],
	([$homeLanguage, $visibleLanguages]) => runnerLanguages($homeLanguage, $visibleLanguages)
);

export function changeHomeLanguage(language: string) {
	const previous = get(homeLanguage);
	visibleLanguages.update((visible) => visibleAfterHomeChange(previous, language, visible));
	homeLanguage.set(language);
}

/** Make a language the one being learned, which swaps its runner in for the previous target's. */
export function activateRunner(language: string) {
	const home = get(homeLanguage);
	visibleLanguages.update((visible) => [
		...(home ? [home] : []),
		language,
		...visible.filter((l) => l !== language && l !== home)
	]);
}

/**
 * Cheatsheet Builder: feature slugs the user has selected for their cheatsheet.
 * Persisted so a sheet built up over several study sessions survives a reload.
 */
export const selectedFeatures = persisted<string[]>('selectedFeatures', []);

/**
 * Learning progress: learned feature slugs per "<home>-><target>" language pair.
 */
export const learnedFeatures = persisted<Record<string, string[]>>('learnedFeatures', {});

/**
 * Review queue: feature slugs skipped for later, per language pair.
 */
export const reviewFeatures = persisted<Record<string, string[]>>('reviewFeatures', {});

/**
 * Topics where the learner saw the answer, per language pair. A later pass without
 * showing it clears the mark.
 */
export const assistedFeatures = persisted<Record<string, string[]>>('assistedFeatures', {});

/** When each passed topic next comes back for a retest, per language pair. */
export const retestSchedule = persisted<Record<string, Record<string, RetestEntry>>>(
	'retestSchedule',
	{}
);

/** Unfinished attempts, keyed by "<pair>|<slug>". Cleared when the topic passes. */
export const attemptDrafts = persisted<Record<string, string>>('attemptDrafts', {});

export function setAssisted(pair: string, slug: string, assisted: boolean) {
	assistedFeatures.update((all) => {
		const others = (all[pair] ?? []).filter((s) => s !== slug);
		return { ...all, [pair]: assisted ? [...others, slug] : others };
	});
}

function updateRetest(
	pair: string,
	slug: string,
	change: (current: RetestEntry | undefined) => RetestEntry | null
) {
	retestSchedule.update((all) => {
		const { [slug]: current, ...others } = all[pair] ?? {};
		const entry = change(current);
		return { ...all, [pair]: entry ? { ...others, [slug]: entry } : others };
	});
}

export function scheduleRetest(pair: string, slug: string, helped: boolean, now: number) {
	updateRetest(pair, slug, (current) => nextRetest(current, now, helped));
}

export function postponeRetest(pair: string, slug: string, now: number) {
	updateRetest(pair, slug, (current) => (current ? retestPostponed(current, now) : null));
}

export function saveDraft(key: string, text: string | null) {
	attemptDrafts.update((all) => {
		const next = { ...all };
		if (text === null) {
			delete next[key];
		} else {
			next[key] = text;
		}
		return next;
	});
}

export function setLearned(pair: string, slug: string, learned: boolean) {
	learnedFeatures.update((all) => {
		const others = (all[pair] ?? []).filter((s) => s !== slug);
		return { ...all, [pair]: learned ? [...others, slug] : others };
	});
	if (learned) setForReview(pair, slug, false);
}

export function setForReview(pair: string, slug: string, forReview: boolean) {
	reviewFeatures.update((all) => {
		const others = (all[pair] ?? []).filter((s) => s !== slug);
		return { ...all, [pair]: forReview ? [...others, slug] : others };
	});
}

export function toggleFeature(slug: string) {
	selectedFeatures.update((arr) =>
		arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug]
	);
}

/**
 * Helper operations for visibleLanguages store
 */
export function toggleLanguage(lang: string) {
	visibleLanguages.update((arr = []) => {
		const set = new Set(arr);
		if (set.has(lang)) {
			set.delete(lang);
		} else {
			set.add(lang);
		}
		// preserve previous ordering, append newly added language at end
		const result = [
			...arr.filter((l) => set.has(l)),
			...Array.from(set).filter((l) => !arr.includes(l))
		].filter(Boolean);
		return result;
	});
}

export function setLanguages(list: string[]) {
	visibleLanguages.set(list);
}
