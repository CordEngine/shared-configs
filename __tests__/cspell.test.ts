// __tests__/cspell.test.ts
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { parse as parseJSON5 } from 'json5';

const readConfig = (path: string) => {
	const content = readFileSync(path, 'utf-8');
	return parseJSON5(content);
};

describe('CSpell Configuration', () => {
	const dictionaryPath = join(
		process.cwd(),
		'cspell-dictionary/dictionary.txt',
	);
	const config = readConfig('./.cspell.json');

	test('validates against official schema', async () => {
		const ajv = new Ajv({
			strict: false,
			allowUnionTypes: true,
			logger: {
				// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally suppressing non-critical Ajv warnings
				warn: () => {}, // Suppress warnings
				// biome-ignore lint/suspicious/noEmptyBlockStatements: Intentionally suppressing non-critical Ajv warnings
				log: () => {},
				error: console.error,
			},
		});

		const schemaPath = join(
			process.cwd(),
			'node_modules/@cspell/cspell-types/cspell.schema.json',
		);
		const schema = readConfig(schemaPath);

		const validate = ajv.compile(schema);
		const isValid = validate(config);

		if (!isValid) {
			console.error('CSpell config validation errors:', validate.errors);
		}
		expect(isValid).toBe(true);
	});

	test('dictionary file exists', () => {
		expect(existsSync(dictionaryPath)).toBe(true);
	});

	test('dictionary file is readable', () => {
		expect(() => readFileSync(dictionaryPath, 'utf-8')).not.toThrow();
	});

	test('dictionary file contains valid entries', () => {
		const content = readFileSync(dictionaryPath, 'utf-8');
		const lines = content.split('\n').filter((line) => line.trim() !== '');

		const validPrefixes = ['~', '+', '*', '!'];
		const errors: string[] = [];

		lines.forEach((line, index) => {
			// Skip empty lines and comments
			if (line.trim() === '' || line.startsWith('//')) {
				return;
			}

			// Check for invalid characters in the line
			const hasInvalidChars = /[^a-zA-Z0-9\-~+*!\s]/.test(line);
			if (hasInvalidChars) {
				errors.push(`Line ${index + 1}: Contains invalid characters: ${line}`);
			}

			// Check prefix special characters
			const firstChar = line[0];
			if (firstChar && validPrefixes.includes(firstChar)) {
				const word = line.slice(1);
				if (!word.trim()) {
					errors.push(
						`Line ${index + 1}: Special character prefix with no word: ${line}`,
					);
				}
			}

			// Check for + and * as suffixes
			if (line.endsWith('+') || line.endsWith('*')) {
				const word = line.slice(0, -1);
				if (!word.trim()) {
					errors.push(
						`Line ${index + 1}: Special character suffix with no word: ${line}`,
					);
				}
			}

			// Check for multiple words on the same line
			const wordParts = line
				.replace(/^[~+*!]/, '')
				.replace(/[+*]$/, '')
				.trim()
				.split(/\s+/);
			if (wordParts.length > 1) {
				errors.push(
					`Line ${index + 1}: Multiple words found on single line: ${line}`,
				);
			}
		});

		if (errors.length > 0) {
			console.error('Dictionary validation errors:\n', errors.join('\n'));
		}
		expect(errors).toHaveLength(0);
	});
});
