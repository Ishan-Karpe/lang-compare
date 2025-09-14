import type { PageLoad } from './$types';
import comparisonData from '$lib/data/comparison-data.json';

export const load: PageLoad = async () => {
	return {
		comparisonData: comparisonData.rows
	};
};
