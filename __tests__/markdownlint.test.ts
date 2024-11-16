import { describe, expect, test } from 'bun:test';
import Ajv from 'ajv';
import semver from 'semver';
import mdConfig from '../.markdownlint.json';
import mdSchema from '../node_modules/markdownlint-cli2/schema/markdownlint-config-schema.json';
import packageJson from '../package.json';

describe('markdownlint', () => {
	test('is pinned peerDependency', () => {
		expect(
			semver.valid(packageJson.peerDependencies['markdownlint-cli2']),
		).not.toBeNull();
		expect(packageJson.devDependencies).not.toContainKey('markdownlint-cli2');
		if ('dependencies' in packageJson) {
			expect(packageJson.dependencies).not.toContainKey('markdownlint-cli2');
		}
	});

	test('is exported as ./markdownlint in package.json', () => {
		expect('./markdownlint' in packageJson.exports).toBe(true);
		expect(packageJson.exports['./markdownlint']).toEqual(
			'./.markdownlint.json',
		);
	});

	test('config specifies schema matching pinned version', () => {
		expect(mdConfig).toHaveProperty('$schema');

		const schemaVersion = new RegExp(/(\d+\.\d+\.\d+)/).exec(
			mdConfig.$schema,
		)?.[1];
		expect(schemaVersion).toEqual(
			packageJson.peerDependencies['markdownlint-cli2'],
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
		const validate = ajv.compile(mdSchema);

		const isValid = validate(mdConfig);
		const formattedErrors = validate.errors?.map((error) => ({
			message: error.message,
			params: error.params,
			path: error.instancePath || '(root)',
		}));

		expect(isValid, JSON.stringify(formattedErrors, null, 2)).toBeTruthy();
	});
});
