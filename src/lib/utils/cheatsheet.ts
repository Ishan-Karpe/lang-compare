export interface CheatsheetSelection {
	features: string[]; // feature slugs
	langs: string[]; // language display names
	home: string | null; // Bridge Mode home language
}

/**
 * Encode a cheatsheet selection as a shareable query string
 * (?f=slug,slug&l=lang,lang&home=lang). Works on the static adapter — no server.
 */
export function encodeSelection(sel: CheatsheetSelection): string {
	const params = new URLSearchParams();
	if (sel.features.length) params.set('f', sel.features.join(','));
	if (sel.langs.length) params.set('l', sel.langs.join(','));
	if (sel.home) params.set('home', sel.home);
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

export function decodeSelection(searchParams: URLSearchParams): CheatsheetSelection {
	const split = (v: string | null) =>
		v
			? v
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];
	return {
		features: split(searchParams.get('f')),
		langs: split(searchParams.get('l')),
		home: searchParams.get('home')
	};
}
