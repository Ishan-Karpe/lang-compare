import { describe, expect, it } from 'vitest';
import { enginesFor } from './runner';

describe('enginesFor', () => {
	it('needs only Python when learning Java from Python', () => {
		expect(enginesFor(['Python 3.12', 'Java (LTS)'])).toEqual(['py']);
	});

	it('does not confuse Java with JavaScript', () => {
		expect(enginesFor(['JavaScript (ES6+)', 'Java (LTS)'])).toEqual(['js']);
	});

	it('returns each selected engine and nothing for link-only languages', () => {
		expect(enginesFor(['Python 3.12', 'TypeScript'])).toEqual(['py', 'ts']);
		expect(enginesFor(['Go', 'C (C17)', 'C++ (C++20)'])).toEqual([]);
	});

	it('uses the remote engine for Rust', () => {
		expect(enginesFor(['Python 3.12', 'Rust'])).toEqual(['py', 'rust']);
	});
});
