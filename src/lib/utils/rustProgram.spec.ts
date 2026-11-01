import { describe, expect, it } from 'vitest';
import { toRustProgram } from './rustProgram.js';

describe('toRustProgram', () => {
	it('wraps statements in main', () => {
		expect(toRustProgram('println!("hi");')).toBe(
			'#![allow(unused)] fn main() {\nprintln!("hi");\n}\n'
		);
	});

	it('leaves a program with its own main alone', () => {
		const code = 'fn main() {\n    println!("hi");\n}';
		expect(toRustProgram(code)).toBe(`#![allow(unused)]\n${code}\n`);
	});

	it('keeps the learner code on its own lines for compiler errors', () => {
		const lines = toRustProgram('let a = 1;\nlet b = 2;').split('\n');
		expect(lines[1]).toBe('let a = 1;');
		expect(lines[2]).toBe('let b = 2;');
	});
});
