import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render the language toggles toolbar', async () => {
		// Mock data to pass to the component
		const mockData = {
			comparisonData: []
		};

		render(Page, { data: mockData });

		const toggleButton = page.getByRole('button').first();
		await expect.element(toggleButton).toBeInTheDocument();
	});
});
