import { describe, expect, it } from 'vitest';
import { missingConcepts, stripCommentsAndStrings } from './conceptCheck.js';

describe('missingConcepts', () => {
	it('catches an attempt that only prints the expected text', () => {
		expect(missingConcepts('println!("Hi Ada!");', [['fn greet'], ['->']])).toEqual([
			['fn greet'],
			['->']
		]);
	});

	it('does not count a word in a comment or a string', () => {
		const code = '// HashMap\nprintln!("HashMap");';
		expect(missingConcepts(code, [['HashMap']])).toEqual([['HashMap']]);
	});

	it('accepts any alternative in a group', () => {
		const groups = [['.clone()', '&a']];
		expect(missingConcepts('let b = &a;', groups)).toEqual([]);
		expect(missingConcepts('let b = a.clone();', groups)).toEqual([]);
		expect(missingConcepts('let b = a;', groups)).toEqual(groups);
	});

	it('matches whole words, without being fooled by longer ones', () => {
		expect(missingConcepts('public', [['pub']])).toEqual([['pub']]);
		expect(missingConcepts('pub fn f() {}', [['pub']])).toEqual([]);
		expect(missingConcepts('let x = 2_i64;', [['i64']])).toEqual([]);
	});

	it('ignores differences in whitespace', () => {
		expect(missingConcepts('let   (a, b) = t;', [['let (']])).toEqual([]);
	});

	it('passes when nothing is required', () => {
		expect(missingConcepts('anything')).toEqual([]);
	});
});

describe('stripCommentsAndStrings', () => {
	it('handles escaped quotes and block comments', () => {
		expect(stripCommentsAndStrings('a("x\\"y"); /* b */ c')).toBe('a(""); c');
	});
});
