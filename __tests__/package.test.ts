import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
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
		console.log(exports['./cspell']);

		expect('./biome' in exports).toBe(true);
		expect('./cspell' in exports).toBe(true);
		expect('./markdownlint' in exports).toBe(true);
	});

	test('has required peer dependencies', () => {
		expect(packageJson).toHaveProperty('peerDependencies');
		const peerDeps = packageJson.peerDependencies;

		expect(peerDeps).toHaveProperty('@biomejs/biome');
		expect(peerDeps).toHaveProperty('markdownlint-cli2');
	});

	test('peer dependencies have valid version specifiers', () => {
		const peerDeps = packageJson.peerDependencies;

		expect(typeof peerDeps['@biomejs/biome']).toBe('string');
		expect(typeof peerDeps['markdownlint-cli2']).toBe('string');

		const semverRegex = /^\^?\d+\.\d+\.\d+$/;
		expect(peerDeps['@biomejs/biome']).toMatch(semverRegex);
		expect(peerDeps['markdownlint-cli2']).toMatch(semverRegex);
	});
});
