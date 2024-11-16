import { describe, expect, test } from 'bun:test';
import biomeSchema from '@biomejs/biome/configuration_schema.json';
import Ajv from 'ajv';
import semver from 'semver';
import biomeConfig from '../biome.json';
import packageJson from '../package.json';

describe('Biome', () => {
	test('is pinned peerDependency', () => {
		expect(
			semver.valid(packageJson.peerDependencies['@biomejs/biome']),
		).not.toBeNull();
		expect(packageJson.devDependencies).not.toContainKey('@biomejs/biome');
		if ('dependencies' in packageJson) {
			expect(packageJson.dependencies).not.toContainKey('@biomejs/biome');
		}
	});

	test('is trusted dependency', () => {
		expect(packageJson.trustedDependencies).toContain('@biomejs/biome');
	});

	test('is exported as ./biome in package.json', () => {
		expect('./biome' in packageJson.exports).toBe(true);
		expect(packageJson.exports['./biome']).toEqual('./biome.json');
	});

	test('config specifies schema matching pinned version', () => {
		expect(biomeConfig).toHaveProperty('$schema');

		const schemaVersion = new RegExp(/(\d+\.\d+\.\d+)/).exec(
			biomeConfig.$schema,
		)?.[1];
		expect(schemaVersion).toEqual(
			packageJson.peerDependencies['@biomejs/biome'],
		);
	});

	test('config validates to official schema', () => {
		const ajv = new Ajv({
			strict: false,
			allowUnionTypes: true,
			logger: false,
			validateSchema: true,
			validateFormats: true,
			allErrors: true,
			strictTuples: false,
		});
		const validate = ajv.compile(biomeSchema);

		const isValid = validate(biomeConfig);
		const formattedErrors = validate.errors?.map((error) => ({
			message: error.message,
			params: error.params,
			path: error.instancePath || '(root)',
		}));

		expect(isValid, JSON.stringify(formattedErrors, null, 2)).toBeTruthy();
	});
});
