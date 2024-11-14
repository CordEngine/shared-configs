import { describe, expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parse as parseJSON5 } from 'json5';

const readConfig = (path: string) => {
	const content = readFileSync(path, 'utf-8');
	return parseJSON5(content);
};

describe('Package Configuration', () => {
	const packageJson = readConfig('./package.json');

	test('exports required configurations', () => {
		expect(packageJson).toHaveProperty('exports');
		const exports = packageJson.exports;

		expect('./biome' in exports).toBe(true);
		expect('./cspell' in exports).toBe(true);
		expect('./markdownlint' in exports).toBe(true);
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

	test('has required peer dependencies', () => {
		expect(packageJson).toHaveProperty('peerDependencies');
		const peerDeps = packageJson.peerDependencies;

		expect(peerDeps).toHaveProperty('@biomejs/biome');
		expect(peerDeps).toHaveProperty('markdownlint-cli2');
	});
});
