import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { parse as parseJSON5 } from 'json5';

const readConfig = (path: string) => {
	const content = readFileSync(path, 'utf-8');
	return parseJSON5(content);
};

describe('Markdown Lint Configuration', () => {
	const configs = {
		base: readConfig(join(process.cwd(), '.markdownlint.json')),
		cli: readConfig(join(process.cwd(), '.markdownlint-cli2.jsonc')),
	};

	test('validates against official schemas', async () => {
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

		const baseSchemaPath = join(
			process.cwd(),
			'node_modules/markdownlint/schema/markdownlint-config-schema.json',
		);
		const cliSchemaPath = join(
			process.cwd(),
			'node_modules/markdownlint-cli2/schema/markdownlint-cli2-config-schema.json',
		);

		const baseSchema = readConfig(baseSchemaPath);
		const cliSchema = readConfig(cliSchemaPath);

		const validateBase = ajv.compile(baseSchema);
		const baseValid = validateBase(configs.base);
		if (!baseValid) {
			console.error(
				'Markdown base config validation errors:',
				validateBase.errors,
			);
		}
		expect(baseValid).toBe(true);

		ajv.addSchema(baseSchema, 'markdownlint-config-schema.json');
		const validateCli = ajv.compile(cliSchema);
		const cliValid = validateCli(configs.cli);
		if (!cliValid) {
			console.error(
				'Markdown CLI config validation errors:',
				validateCli.errors,
			);
		}
		expect(cliValid).toBe(true);
	});

	test('CLI config only adds ignores', () => {
		const allowedCliKeys = ['extends', 'ignores'];
		const extraCliKeys = Object.keys(configs.cli).filter(
			(key) => !allowedCliKeys.includes(key),
		);

		expect(extraCliKeys).toHaveLength(0);
	});
});
