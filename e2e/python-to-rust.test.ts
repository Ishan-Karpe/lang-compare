import { expect, test, type Page } from '@playwright/test';

const section = (page: Page, feature: string) =>
	page.locator('article.feature-section', {
		has: page.getByRole('heading', { name: feature, exact: true })
	});
const rustCard = (page: Page, feature: string) => section(page, feature).locator('.card').nth(1);

/** Stands in for the Rust Playground, so these tests don't depend on the network. */
async function stubPlayground(
	page: Page,
	reply: { success: boolean; stdout: string; stderr: string }
) {
	const requests: string[] = [];
	await page.route('https://play.rust-lang.org/execute', async (route) => {
		requests.push(route.request().postDataJSON().code);
		await route.fulfill({ json: reply });
	});
	return requests;
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Start learning' }).click();
});

test('starts on Python to Rust with the basics', async ({ page }) => {
	await expect(page.getByRole('combobox', { name: 'Language to learn' })).toHaveValue('Rust');
	await expect(page.getByText('0 / 42 learned')).toBeVisible();
	await expect(section(page, 'Ownership and Moves')).toBeVisible();
});

test('a passing attempt counts as learned and offers the next topic', async ({ page }) => {
	const requests = await stubPlayground(page, { success: true, stdout: 'Hello\n', stderr: '' });
	const rust = rustCard(page, 'Stdout');
	await expect(rust).not.toContainText('println!("Hello")');

	await rust.getByRole('textbox').fill('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText('Passed: it compiled and printed the expected output.');
	await expect(page.getByText('1 / 42 learned')).toBeVisible();
	expect(requests[0]).toContain('println!("Hello");');
	await rust.getByRole('button', { name: /^Next:/ }).click();
	await expect(rust).toContainText('✓ Learned');
});

test('a compile error shows the real message and the note, and does not count', async ({
	page
}) => {
	await stubPlayground(page, {
		success: false,
		stdout: '',
		stderr: '   Compiling playground v0.0.1 (/playground)\nerror: expected `;`\n'
	});
	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('textbox').fill('print("Hello")');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText('error: expected `;`');
	await expect(rust).not.toContainText('Compiling playground');
	await expect(rust).toContainText('is a macro');
	await expect(rust).not.toContainText('println!("Hello");');
	await expect(page.getByText('0 / 42 learned')).toBeVisible();
});

test('the wrong output does not count', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Goodbye\n', stderr: '' });
	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('textbox').fill('println!("Goodbye");');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText('printed something different');
	await expect(page.getByText('0 / 42 learned')).toBeVisible();
});

test('an unreachable Playground is not graded', async ({ page }) => {
	await page.route('https://play.rust-lang.org/execute', (route) => route.abort());
	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('textbox').fill('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText("Your attempt wasn't graded");
	await expect(page.getByText('0 / 42 learned')).toBeVisible();
});

test('a fix exercise starts from the broken code', async ({ page }) => {
	const rust = rustCard(page, 'Ownership and Moves');
	await expect(rust).toContainText('E0382');
	await expect(rust.getByRole('textbox')).toHaveValue(/let b = a;/);
	await expect(rust).not.toContainText('a.clone()');
});

test('skipping joins the review queue, and next moves on', async ({ page }) => {
	const read = (feature: string) =>
		section(page, feature).getByRole('button', { name: 'Mark as read' }).click();
	await read('Why Rust?');
	await read('Installing Rust and Cargo');
	await read('Build Process (Tooling)');
	await read('Run Process (Tooling)');

	await expect(page.getByRole('button', { name: 'Next: Stdout' }).first()).toBeVisible();
	await rustCard(page, 'Stdout').getByRole('button', { name: 'Skip for now' }).click();

	await expect(page.getByRole('button', { name: 'Next: Stderr' }).first()).toBeVisible();
	await expect(page.getByText('1 to review')).toBeVisible();
	await expect(section(page, 'Stdout').getByText('to review')).toBeVisible();
	await expect(page.getByText('0 / 42 learned')).toBeHidden();
	await expect(page.getByText('4 / 42 learned')).toBeVisible();
});

test('the right code is on every card after a reload', async ({ page }) => {
	await page.reload();
	await expect(rustCard(page, 'Build Process (Tooling)')).toContainText('cargo build');
	await expect(rustCard(page, 'Build Process (Tooling)')).not.toContainText('tsc');
	await page.getByRole('button', { name: /^Next: Why Rust/ }).waitFor();
});

test('progress and next stay on screen while scrolling', async ({ page }) => {
	await section(page, 'Function Definition').scrollIntoViewIfNeeded();
	await expect(page.locator('.language-toolbar')).not.toBeInViewport();
	await expect(page.getByRole('button', { name: /^Next: / }).first()).toBeInViewport();
	await expect(page.locator('.navbar')).toBeInViewport();
});

test('cards fit the page at a medium width', async ({ page }) => {
	await page.setViewportSize({ width: 766, height: 800 });
	const width = await page.evaluate(() => document.documentElement.clientWidth);
	const overflowing = await page
		.locator('article.feature-section .card')
		.evaluateAll(
			(cards, limit) => cards.filter((c) => c.getBoundingClientRect().right > limit + 1).length,
			width
		);
	expect(overflowing).toBe(0);
});

test('next lands on the topic below the sticky bar', async ({ page }) => {
	const read = (feature: string) =>
		section(page, feature).getByRole('button', { name: 'Mark as read' }).click();
	await read('Why Rust?');
	await read('Installing Rust and Cargo');
	await read('Build Process (Tooling)');
	await read('Run Process (Tooling)');
	await section(page, 'Modules and pub').scrollIntoViewIfNeeded();

	await page.locator('.learn-bar').getByRole('button', { name: 'Next: Stdout' }).click();

	const gap = () =>
		page.evaluate(() => {
			const heading = document.getElementById('stdout')?.querySelector('h3');
			const bar = document.querySelector('.learn-bar');
			return heading && bar
				? heading.getBoundingClientRect().top - bar.getBoundingClientRect().bottom
				: -1;
		});
	await expect.poll(gap, { timeout: 10_000 }).toBeGreaterThanOrEqual(0);
	await expect.poll(gap, { timeout: 10_000 }).toBeLessThan(120);
});

test('practice fits a phone-sized screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	const rust = rustCard(page, 'Stdout');
	await expect(rust.getByRole('textbox')).toBeVisible();
	const { scrollWidth, width } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		width: document.documentElement.clientWidth
	}));
	expect(scrollWidth).toBeLessThanOrEqual(width);
	const box = await rust.getByRole('textbox').boundingBox();
	expect(box && box.x + box.width).toBeLessThanOrEqual(width);
});

test('the right output without the required concept does not count', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Hi Ada!\n', stderr: '' });
	const rust = rustCard(page, 'Function Definition');
	await rust.getByRole('textbox').fill('println!("Hi Ada!");');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText("doesn't practice this topic yet");
	await expect(rust).toContainText('fn greet');
	await expect(page.getByText('0 / 42 learned')).toBeVisible();
});

test('required concepts read clearly', async ({ page }) => {
	await expect(rustCard(page, 'Dictionary/HashMap')).toContainText(
		'Your code must use: HashMap, insert or from, .get or contains_key'
	);
});

test('a worked example appears before the attempt, without giving the answer', async ({ page }) => {
	const rust = rustCard(page, 'Set');
	await expect(rust).toContainText('Worked example');
	await expect(rust).toContainText('HashSet::new');
	await expect(rust).not.toContainText('[1, 2, 2]');
});

test('a pass after showing the answer is recorded separately', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Hello\n', stderr: '' });
	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('button', { name: 'Show answer' }).click();
	await rust.getByRole('textbox').fill('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText('Passed with the answer shown');
	await expect(page.getByText('1 with answer shown')).toBeVisible();
	await expect(section(page, 'Stdout').getByText('learned with answer shown')).toBeVisible();
});

test('a peek still counts after a reload', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Hello\n', stderr: '' });
	await rustCard(page, 'Stdout').getByRole('button', { name: 'Show answer' }).click();
	await page.reload();

	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('textbox').fill('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();
	await expect(page.getByText('1 with answer shown')).toBeVisible();
});

test('only the first compiler error shows by default', async ({ page }) => {
	await stubPlayground(page, {
		success: false,
		stdout: '',
		stderr:
			'error[E0425]: the first one\n --> src/main.rs:2:1\n\nerror[E0599]: the second one\n --> src/main.rs:3:1\n\nerror: could not compile `playground` due to 2 previous errors\n'
	});
	const rust = rustCard(page, 'Stdout');
	await rust.getByRole('textbox').fill('nope');
	await rust.getByRole('button', { name: 'Run & check' }).click();

	await expect(rust).toContainText('the first one');
	await expect(rust).not.toContainText('the second one');
	await rust.getByRole('button', { name: 'Show full output (2 errors)' }).click();
	await expect(rust).toContainText('the second one');
});

test('a draft survives a reload and clears on a pass', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Hello\n', stderr: '' });
	await rustCard(page, 'Stdout').getByRole('textbox').fill('println!("Hello");');
	await page.reload();

	const rust = rustCard(page, 'Stdout');
	await expect(rust.getByRole('textbox')).toHaveValue('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();
	await expect(rust).toContainText('Passed');
	const drafts = await page.evaluate(() => localStorage.getItem('attemptDrafts'));
	expect(JSON.parse(drafts ?? '{}')).toEqual({});
});

test('a passed topic comes back for a retest, hiding the answer', async ({ page }) => {
	await stubPlayground(page, { success: true, stdout: 'Hello\n', stderr: '' });
	const first = rustCard(page, 'Stdout');
	await first.getByRole('textbox').fill('println!("Hello");');
	await first.getByRole('button', { name: 'Run & check' }).click();
	await expect(first).toContainText('Passed');

	const pair = 'Python 3.12->Rust';
	const schedule = (await page.evaluate(() => localStorage.getItem('retestSchedule'))) ?? '{}';
	const entry = JSON.parse(schedule)[pair].stdout;
	expect(entry.stage).toBe(0);
	expect(entry.due).toBeGreaterThan(Date.now());

	// Move the retest into the past, as if a day has gone by.
	await page.evaluate(
		(value) => localStorage.setItem('retestSchedule', value),
		JSON.stringify({ [pair]: { stdout: { stage: 0, due: 1 } } })
	);
	await page.reload();

	const rust = rustCard(page, 'Stdout');
	await expect(page.getByRole('button', { name: 'Retest: Stdout' }).first()).toBeVisible();
	await expect(page.getByText('1 retest due')).toBeVisible();
	await expect(rust).toContainText('Quick retest');
	await expect(rust.getByRole('textbox')).toHaveValue('');
	await rust.getByRole('textbox').fill('println!("Hello");');
	await rust.getByRole('button', { name: 'Run & check' }).click();
	await expect(rust).toContainText('Passed');

	const after = JSON.parse(
		(await page.evaluate(() => localStorage.getItem('retestSchedule'))) ?? '{}'
	);
	expect(after[pair].stdout.stage).toBe(1);
});
