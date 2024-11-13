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
	const config = readConfig('./.cspell.json');

	test('validates against official schema', async () => {
		const ajv = new Ajv({
			strict: false,
			allowUnionTypes: true,
			logger: {
				// biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
				warn: () => {}, // Suppress warnings
				// biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
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
		const dictionaryPath = join(
			process.cwd(),
			'cspell-dictionary/dictionary.txt',
		);
		expect(existsSync(dictionaryPath)).toBe(true);
	});

	test('dictionary file is readable', () => {
		const dictionaryPath = join(
			process.cwd(),
			'cspell-dictionary/dictionary.txt',
		);
		expect(() => readFileSync(dictionaryPath, 'utf-8')).not.toThrow();
	});
});
