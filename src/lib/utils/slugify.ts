export function slugify(input: string): string {
	if (!input) return '';
	return input
		.toString()
		.toLowerCase()
		.normalize('NFKD') // split accents from letters
		.replace(/\p{Diacritic}/gu, '') // remove diacritics (when supported)
		.replace(/[\u0300-\u036f]/g, '') // fallback removal of combining marks
		.replace(/&/g, 'and') // make ampersands readable and avoid double-hyphens
		.replace(/[^\w\s-]/g, '') // remove punctuation except underscores, spaces and hyphens
		.trim()
		.replace(/\s+/g, '-') // spaces -> hyphens
		.replace(/-+/g, '-'); // collapse multiple hyphens
}

export default slugify;
