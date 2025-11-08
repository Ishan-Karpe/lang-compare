/**
 * Copy text to clipboard with feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error('Failed to copy text:', err);
		// Fallback for older browsers
		return fallbackCopyTextToClipboard(text);
	}
}

/**
 * Fallback method for copying text (for older browsers)
 */
function fallbackCopyTextToClipboard(text: string): boolean {
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.style.position = 'fixed';
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.opacity = '0';
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		return successful;
	} catch (err) {
		console.error('Fallback: Failed to copy', err);
		document.body.removeChild(textArea);
		return false;
	}
}

/**
 * Extract plain text from HTML string
 */
export function stripHtmlTags(html: string): string {
	const tmp = document.createElement('div');
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || '';
}

/**
 * Setup copy button functionality for all code cards
 */
export function setupCopyButtons() {
	document.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement;
		const copyButton = target.closest('.copy-btn');

		if (copyButton) {
			const codeHtml = copyButton.getAttribute('data-code');
			if (!codeHtml) return;

			// Extract plain text from HTML
			const codeText = stripHtmlTags(codeHtml);

			// Copy to clipboard
			const success = await copyToClipboard(codeText);

			if (success) {
				// Show feedback
				showCopyFeedback(copyButton as HTMLElement);
			}
		}
	});
}

/**
 * Show visual feedback when code is copied
 */
function showCopyFeedback(button: HTMLElement) {
	const originalContent = button.innerHTML;

	// Change button content to checkmark
	button.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
		</svg>
	`;
	button.classList.add('btn-success');

	// Restore original content after 2 seconds
	setTimeout(() => {
		button.innerHTML = originalContent;
		button.classList.remove('btn-success');
	}, 2000);
}
