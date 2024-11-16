import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import packageJson from '../package.json';

describe('Package configuration', () => {
	test('has required fields for publishing', () => {
		const requiredFields = [
			'name',
			'version',
			'description',
			'author',
			'license',
			'repository',
		];

		for (const field of requiredFields) {
			expect(packageJson).toHaveProperty(field);
		}
	});

	test('export paths resolve to existing files', () => {
		const exports = packageJson.exports;

		for (const [_exportPath, resolvedPath] of Object.entries(exports)) {
			let fullPath = '';
			// Remove leading './' if present
			if (typeof resolvedPath === 'string') {
				const cleanedPath = resolvedPath.replace(/^.\//, '');
				fullPath = path.resolve(__dirname, '..', cleanedPath);
			}
			expect(existsSync(fullPath)).toBe(true);
		}
	});
});
