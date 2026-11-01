import { expect, test, type Page } from '@playwright/test';

const PYODIDE = '**/pyodide/**';

/** Blocks the real download and records whether a runner tried to fetch Pyodide. */
async function trackPyodide(page: Page) {
	const requests: string[] = [];
	await page.context().route(PYODIDE, (route) => {
		requests.push(route.request().url());
		return route.abort();
	});
	return requests;
}

const pickPair = async (page: Page, home: string, target: string) => {
	await page.getByRole('combobox', { name: 'Language you know' }).selectOption(home);
	await page.getByRole('combobox', { name: 'Language to learn' }).selectOption(target);
};

const card = (page: Page, feature: string, language: string) =>
	page
		.locator('article.feature-section', {
			has: page.getByRole('heading', { name: feature, exact: true })
		})
		.locator('.card', { hasText: language.toUpperCase() });

test('loads no runner until a language is selected', async ({ page }) => {
	const requests = await trackPyodide(page);
	await page.goto('/');
	await page.waitForTimeout(800);
	expect(page.workers()).toHaveLength(0);
	expect(requests).toHaveLength(0);
});

test('Python to Rust or Java preloads the Python runner only', async ({ page }) => {
	const requests = await trackPyodide(page);
	await page.goto('/');
	await page.getByRole('button', { name: 'Start learning' }).click();
	await expect.poll(() => page.workers().length).toBe(1);
	await expect.poll(() => requests.length).toBeGreaterThan(0);

	await page.getByRole('combobox', { name: 'Language to learn' }).selectOption('Java (LTS)');
	await expect.poll(() => page.workers().length).toBe(1);
});

test('JavaScript to TypeScript never fetches Python', async ({ page }) => {
	const requests = await trackPyodide(page);
	await page.goto('/');
	await pickPair(page, 'JavaScript (ES6+)', 'TypeScript');
	await page.getByRole('button', { name: 'Start learning' }).click();
	await expect.poll(() => page.workers().length).toBe(1);

	const js = card(page, 'Stdout', 'JavaScript (ES6+)').first();
	await js.getByRole('button', { name: /Run/ }).click();
	await expect(js).toContainText('Hello');
	expect(requests).toHaveLength(0);
});

test('swapping the learning pair stops the old runner', async ({ page }) => {
	await trackPyodide(page);
	await page.goto('/');
	await pickPair(page, 'Python 3.12', 'JavaScript (ES6+)');
	await page.getByRole('button', { name: 'Start learning' }).click();
	await expect.poll(() => page.workers().length).toBe(2);

	await page.getByRole('combobox', { name: 'Language to learn' }).selectOption('Java (LTS)');
	await expect.poll(() => page.workers().length).toBe(1);

	await page.getByRole('combobox', { name: 'Language you know' }).selectOption('Go');
	await expect(page.getByRole('combobox', { name: 'Language to learn' })).toHaveValue('Java (LTS)');
	await expect.poll(() => page.workers().length).toBe(0);
});

test('a visible language outside the pair stays inactive until activated', async ({ page }) => {
	await trackPyodide(page);
	await page.goto('/');
	await page.getByRole('button', { name: 'Start learning' }).click();
	await page.getByRole('button', { name: /^Toggle TypeScript/ }).click();

	const ts = card(page, 'Stdout', 'TypeScript');
	await expect(ts.getByRole('button', { name: /Run/ })).toHaveCount(0);
	await ts.getByRole('button', { name: 'Learn TypeScript to run this' }).click();

	await expect(page.getByRole('combobox', { name: 'Language to learn' })).toHaveValue('TypeScript');
	await expect(ts.getByRole('textbox')).toBeVisible();
});
