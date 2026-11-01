/**
 * Remove comments and string contents, so writing a required word in a comment or
 * printing it as text doesn't count as using it.
 *
 * @param {string} code
 * @returns {string}
 */
export function stripCommentsAndStrings(code) {
	return code
		.replace(/"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (match) =>
			match.startsWith('"') ? '""' : ' '
		)
		.replace(/\s+/g, ' ');
}

/**
 * @param {string} code Code that has been through stripCommentsAndStrings
 * @param {string} token
 * @returns {boolean}
 */
function usesToken(code, token) {
	const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const start = /^[A-Za-z]/.test(token) ? '(?<![A-Za-z])' : '';
	const end = /[A-Za-z]$/.test(token) ? '(?![A-Za-z])' : '';
	return new RegExp(start + escaped + end).test(code);
}

/**
 * The required concepts an attempt doesn't use. Each group needs any one of its
 * alternatives, so more than one valid approach can pass.
 *
 * @param {string} attempt
 * @param {string[][]} requirements
 * @returns {string[][]}
 */
export function missingConcepts(attempt, requirements = []) {
	const code = stripCommentsAndStrings(attempt);
	return requirements.filter((group) => !group.some((token) => usesToken(code, token)));
}
