import { describe, expect, it } from 'vitest';
import { toJavaProgram } from './javaProgram.js';

describe('toJavaProgram', () => {
	it('wraps statements in a main method', () => {
		const program = toJavaProgram('int x = 5;\nSystem.out.println(x);');
		expect(program).toContain('public class Main {');
		expect(program).toContain('public static void main(String[] args) throws Exception {');
		expect(program).toContain('\t\tint x = 5;');
	});

	it('hoists imports above the class', () => {
		const program = toJavaProgram(
			'import java.util.List;\nimport static java.lang.Math.sqrt;\nint x;'
		);
		expect(program.startsWith('import java.util.List;\nimport static java.lang.Math.sqrt;\n')).toBe(
			true
		);
		expect(program.match(/import/g)).toHaveLength(2);
	});

	it('keeps methods as members when the snippet declares main', () => {
		const code = 'static int one() { return 1; }\npublic static void main(String[] args) {}';
		const program = toJavaProgram(code);
		expect(program).toContain('\tstatic int one() { return 1; }');
		expect(program.match(/void main/g)).toHaveLength(1);
	});

	it('leaves a complete Main class alone', () => {
		const code = 'public class Main {\n}';
		expect(toJavaProgram(code)).toBe(`${code}\n`);
	});
});
