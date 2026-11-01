/**
 * Turn a table snippet or a learner's attempt into a complete main.rs. Rust allows
 * items and `use` inside a function, so anything without its own `main` can go in
 * one. The wrapper keeps to its own lines, so compiler errors show only the learner's
 * code with the carets lined up, though their line numbers run one higher.
 *
 * @param {string} code
 * @returns {string}
 */
export function toRustProgram(code) {
	if (/\bfn\s+main\s*\(/.test(code)) return `#![allow(unused)]\n${code}\n`;
	return `#![allow(unused)] fn main() {\n${code}\n}\n`;
}
