import { describe, expect, it } from 'vitest';
import { decodeSelection, encodeSelection } from './cheatsheet';

describe('cheatsheet selection encoding', () => {
	it('round-trips a full selection', () => {
		const sel = {
			features: ['if-else', 'loop-for'],
			langs: ['Python 3.12', 'Rust'],
			home: 'Python 3.12'
		};
		const qs = encodeSelection(sel);
		const decoded = decodeSelection(new URLSearchParams(qs));
		expect(decoded).toEqual(sel);
	});

	it('returns an empty string for an empty selection', () => {
		expect(encodeSelection({ features: [], langs: [], home: null })).toBe('');
	});

	it('decodes missing params to empty values', () => {
		expect(decodeSelection(new URLSearchParams(''))).toEqual({
			features: [],
			langs: [],
			home: null
		});
	});

	it('handles language names with special characters', () => {
		const sel = { features: ['set'], langs: ['C++ (C++20)', 'JavaScript (ES6+)'], home: null };
		const decoded = decodeSelection(new URLSearchParams(encodeSelection(sel)));
		expect(decoded.langs).toEqual(['C++ (C++20)', 'JavaScript (ES6+)']);
	});
});
