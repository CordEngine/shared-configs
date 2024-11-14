import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { parse as parseJSON } from 'json5';

// Helper to read and parse JSON files
const readJsonConfig = (path: string) => {
	const content = readFileSync(path, 'utf-8');
	return parseJSON(content);
};

describe('Biome Configuration', () => {
	const biomeConfig = readJsonConfig('./biome.json');
	const packageJson = readJsonConfig('./package.json');

	test('has valid structure', () => {
		expect(biomeConfig).toHaveProperty('$schema');
		expect(biomeConfig).toHaveProperty('formatter');
		expect(biomeConfig).toHaveProperty('linter');
	});

	test('has linter rules', () => {
		expect(biomeConfig.linter).toHaveProperty('rules');
		expect(biomeConfig.linter.rules).toBeObject();
	});

	test('schema version matches installed biome version', () => {
		const schemaUrl = biomeConfig.$schema;
		expect(schemaUrl).toBeDefined();

		// Extract version from schema URL
		const schemaVersion = schemaUrl.match(/(\d+\.\d+\.\d+)/)?.[1];
		expect(schemaVersion).toBeDefined();

		// Get installed Biome version
		const biomeVersion = packageJson.peerDependencies[
			'@biomejs/biome'
		]?.replace('^', '');
		expect(biomeVersion).toBeDefined();

		// Compare versions
		expect(schemaVersion).toBe(biomeVersion);
	});

	test('validates against official schema', () => {
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

		const schemaPath = require.resolve(
			'@biomejs/biome/configuration_schema.json',
		);
		const schema = readJsonConfig(schemaPath);

		const validate = ajv.compile(schema);
		const isValid = validate(biomeConfig);

		if (!isValid) {
			const formattedErrors = validate.errors?.map((error) => ({
				path: error.instancePath,
				message: error.message,
				params: error.params,
			}));
			console.error(
				'Biome configuration validation failed:',
				JSON.stringify(formattedErrors, null, 2),
			);
		}

		expect(isValid).toBe(true);
	});
});
