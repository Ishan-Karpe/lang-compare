/**
 * Smooth scroll to element with offset for fixed headers
 */
export function smoothScrollToElement(elementId: string, offset = 100) {
	const element = document.getElementById(elementId);
	if (!element) return;

	const yOffset = -offset;
	const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

	window.scrollTo({
		top: y,
		behavior: 'smooth'
	});
}

/**
 * Setup smooth scroll for all anchor links
 */
export function setupSmoothScroll() {
	// Handle hash navigation on page load
	if (window.location.hash) {
		const elementId = window.location.hash.substring(1);
		setTimeout(() => smoothScrollToElement(elementId), 100);
	}

	// Handle anchor link clicks
	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const anchor = target.closest('a[href^="#"]');

		if (anchor) {
			e.preventDefault();
			const href = anchor.getAttribute('href');
			if (href && href.startsWith('#')) {
				const elementId = href.substring(1);
				smoothScrollToElement(elementId);

				// Update URL without triggering navigation
				window.history.pushState(null, '', href);

				// Mark active link
				updateActiveLink(elementId);
			}
		}
	});

	// Update active link on scroll
	setupScrollSpy();
}

/**
 * Update active navigation link
 */
function updateActiveLink(elementId: string) {
	// Remove active class from all links
	document.querySelectorAll('.nav-link').forEach((link) => {
		link.classList.remove('active');
	});

	// Add active class to current link
	const activeLink = document.querySelector(`a[href="#${elementId}"]`);
	if (activeLink) {
		activeLink.classList.add('active');
	}
}

/**
 * Setup scroll spy to highlight active section
 */
function setupScrollSpy() {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const id = entry.target.id;
					if (id) {
						updateActiveLink(id);
					}
				}
			});
		},
		{
			rootMargin: '-100px 0px -80% 0px',
			threshold: 0
		}
	);

	// Observe all sections with IDs
	document.querySelectorAll('section[id], div[id]').forEach((section) => {
		observer.observe(section);
	});
}
