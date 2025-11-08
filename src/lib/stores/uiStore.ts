import { persisted } from 'svelte-persisted-store';
import { writable, get } from 'svelte/store';

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

export function clearLanguages() {
	visibleLanguages.set([]);
}

export function isLanguageVisible(lang: string) {
	const arr = get(visibleLanguages) || [];
	return arr.length === 0 ? true : arr.includes(lang);
}
