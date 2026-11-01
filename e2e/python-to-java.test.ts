import { expect, test } from '@playwright/test';

const section = (page: import('@playwright/test').Page, feature: string) =>
	page.locator('article.feature-section', {
		has: page.getByRole('heading', { name: feature, exact: true })
	});

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.getByRole('combobox', { name: 'Language to learn' }).selectOption('Java (LTS)');
	await page.getByRole('button', { name: 'Start learning' }).click();
});

test('hides the Java answer and note until there is an attempt', async ({ page }) => {
	const java = section(page, 'Primitive Data Types').locator('.card').nth(1);
	await expect(java.getByRole('textbox')).toBeVisible();
	await expect(java).not.toContainText('Integer.MAX_VALUE');
	await expect(java).not.toContainText('silently overflows');
	await expect(java.getByText('⚠ gotcha')).toBeVisible();

	await java.getByRole('textbox').fill('int x = 1;');
	await java.getByRole('button', { name: 'Check answer' }).click();
	await expect(java).toContainText('Integer.MAX_VALUE');
	await expect(java).toContainText('silently overflows');
	await expect(java).toContainText('-2147483648');
});

test('teaches functions and classes, without Rust-only topics', async ({ page }) => {
	await expect(section(page, 'Function Definition')).toBeVisible();
	await expect(section(page, 'OOP: Class/Struct')).toBeVisible();
	await expect(section(page, 'Ownership and Moves')).toHaveCount(0);
	await expect(page.getByText('0 / 31 learned')).toBeVisible();
});

test('a blank attempt cannot be checked', async ({ page }) => {
	const java = section(page, 'Stdout').locator('.card').nth(1);
	await expect(java.getByRole('button', { name: 'Check answer' })).toBeDisabled();
});

test('self-grading updates saved progress', async ({ page }) => {
	const first = section(page, 'Stdout');
	const java = first.locator('.card').nth(1);
	await java.getByRole('textbox').fill('System.out.println("Hello");');
	await java.getByRole('button', { name: 'Check answer' }).click();
	await expect(java).toContainText('That matches the reference.');
	await java.getByRole('button', { name: 'I got it' }).click();

	await expect(first.getByText('learned', { exact: true })).toBeVisible();
	await expect(page.getByText('1 / 31 learned')).toBeVisible();

	await page.reload();
	await expect(page.getByText('1 / 31 learned')).toBeVisible();
});

test('read-only topics move the next button along', async ({ page }) => {
	await expect(page.getByRole('button', { name: /^Next: Build Process/ })).toBeVisible();
	await section(page, 'Build Process (Tooling)')
		.getByRole('button', { name: 'Mark as read' })
		.click();
	await expect(page.getByRole('button', { name: /^Next: Run Process/ })).toBeVisible();
});

test('cheatsheet keeps the home language and notes', async ({ page }) => {
	await section(page, 'Length').getByRole('button', { name: 'Add to cheatsheet' }).click();
	await page.getByRole('link', { name: 'Open cheatsheet' }).click();

	await expect(page.getByText('your language')).toBeVisible();
	await expect(page.locator('.bridge-note')).toContainText('no single');
	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('.navbar')).toBeHidden();
});
