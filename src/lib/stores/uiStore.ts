import { persisted } from 'svelte-persisted-store';
import { writable } from 'svelte/store';

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

/**
 * Cheatsheet Builder: feature slugs the user has selected for their cheatsheet.
 * Session-only by design — a cheatsheet is a throwaway artifact.
 */
export const selectedFeatures = writable<string[]>([]);

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
