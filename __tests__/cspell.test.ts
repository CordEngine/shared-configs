import { describe, expect, test } from 'bun:test';
import cspellSchema from '@cspell/cspell-types/cspell.schema.json';
import Ajv from 'ajv';
import cspellConfig from '../cspell-dictionary/cspell-ext.json';
import packageJson from '../package.json';

describe('CSpell', async () => {
	test('is not a dependency', () => {
		if ('dependencies' in packageJson) {
			expect(packageJson.dependencies).not.toContainKey('cspell');
		}

		if ('devDependencies' in packageJson) {
			expect(packageJson.devDependencies).not.toContainKey('cspell');
		}
	});

	test('is exported as ./cspell in package.json', () => {
		expect('./cspell' in packageJson.exports).toBe(true);
		expect(packageJson.exports['./cspell']).toEqual(
			'./cspell-dictionary/cspell-ext.json',
		);
	});

	test('config validates to official schema', () => {
		const ajv = new Ajv({
			strict: false,
			logger: false,
			validateSchema: true,
			validateFormats: true,
			allErrors: true,
		});
		const validate = ajv.compile(cspellSchema);

		const isValid = validate(cspellConfig);
		const formattedErrors = validate.errors?.map((error) => ({
			message: error.message,
			params: error.params,
			path: error.instancePath || '(root)',
		}));

		expect(isValid, JSON.stringify(formattedErrors, null, 2)).toBeTruthy();
		expect(cspellConfig.version).toEqual('0.2');
	});

	test('defines dictionary', () => {
		expect(cspellConfig).toHaveProperty('dictionaryDefinitions');
		expect(cspellConfig).toHaveProperty('dictionaries');
		expect(cspellConfig.dictionaries).toContain(
			cspellConfig.dictionaryDefinitions[0]?.name,
		);
	});

	const dictionary = Bun.file('cspell-dictionary/dictionary.txt');
	const lines = (await dictionary.text())
		.split('\n')
		.map((line) => {
			// Strip comments
			const commentIndex = line.indexOf('#');
			if (commentIndex === 0) {
				return '';
			}
			if (commentIndex > 0) {
				// Return the part before the comment, trimmed
				return line.substring(0, commentIndex).trim();
			}
			return line.trim();
		})
		.filter(Boolean); // Remove empty lines

	// Valid characters (letters, numbers, underscore, hyphen, period)
	const validChars = /^[\p{L}\p{N}_.-]+$/u;

	// CSpell dictionary syntax characters (http://cspell.org/docs/dictionaries-custom/#words-list-syntax)
	const syntaxChars = /(^[!~+*])|([+*]$)/;

	test('dictionary is formatted correctly', () => {
		const invalidLines = lines
			.map((line, index) => {
				// Remove special commands for word validation
				const word = line.replace(syntaxChars, '');

				if (!validChars.test(word)) {
					return `Line ${index + 1}: Invalid word format: ${line}`;
				}
				return null;
			})
			.filter(Boolean);

		expect(invalidLines).toEqual([]);
	});

	test('no duplicate words', () => {
		const words = lines.map((line) =>
			line.replace(syntaxChars, '').toLowerCase(),
		);

		const seen = new Set<string>();
		const duplicates = words.filter((word) => {
			if (seen.has(word)) {
				return true;
			}
			seen.add(word);
			return false;
		});

		expect(duplicates).toEqual([]);
	});
});
