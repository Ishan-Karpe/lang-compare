const IMPORT_LINE = /^\s*import\s+(static\s+)?[\w.*]+;\s*$/;

/**
 * Turn a table snippet into a complete Main.java.
 * Imports are hoisted. A snippet that declares its own `main` keeps its methods
 * as class members; anything else becomes the body of a generated `main`.
 *
 * @param {string} code
 * @returns {string}
 */
export function toJavaProgram(code) {
	const lines = code.split('\n');
	const imports = lines.filter((l) => IMPORT_LINE.test(l)).map((l) => l.trim());
	const body = lines.filter((l) => !IMPORT_LINE.test(l));
	const header = imports.length ? `${imports.join('\n')}\n\n` : '';

	if (body.some((l) => /\bclass\s+Main\b/.test(l))) return `${header}${body.join('\n')}\n`;

	const hasMain = body.some((l) => /\bstatic\s+void\s+main\s*\(/.test(l));
	if (hasMain) {
		return `${header}public class Main {\n${indent(body, 1)}\n}\n`;
	}
	return `${header}public class Main {\n\tpublic static void main(String[] args) throws Exception {\n${indent(body, 2)}\n\t}\n}\n`;
}

/**
 * @param {string[]} lines
 * @param {number} depth
 */
function indent(lines, depth) {
	const pad = '\t'.repeat(depth);
	return lines.map((l) => (l ? pad + l : l)).join('\n');
}
