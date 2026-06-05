#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const scanRoots = ['src/app/features', 'src/app/shared'];
const htmlPatterns = [
  {
    name: 'visible text',
    regex: />\s*([A-Za-zÁÉÍÓÚáéíóúÑñ][^<{|]*?)\s*</g,
  },
  {
    name: 'placeholder',
    regex: /\bplaceholder="([A-Za-zÁÉÍÓÚáéíóúÑñ][^"]*)"/g,
  },
  {
    name: 'title',
    regex: /\btitle="([A-Za-zÁÉÍÓÚáéíóúÑñ][^"]*)"/g,
  },
  {
    name: 'aria-label',
    regex: /\baria-label="([A-Za-zÁÉÍÓÚáéíóúÑñ][^"]*)"/g,
  },
];

const tsPatterns = [
  {
    name: 'toast literal',
    regex: /toast\.(success|error|info|warning)\(\s*['"]([^'"]*[A-Za-zÁÉÍÓÚáéíóúÑñ][^'"]*)['"]/g,
  },
  {
    name: 'confirm literal',
    regex: /\b(title|message|confirmLabel|cancelLabel):\s*['"]([^'"]*[A-Za-zÁÉÍÓÚáéíóúÑñ][^'"]*)['"]/g,
  },
];

const allowText = [
  /^[A-Z]{2,5}$/,
  /^ID$/,
  /^IP:$/,
  /^BOB$/,
  /^USD$/,
  /^EUR$/,
  /^MM\/AA$/,
  /^Bs\s?\d+/,
  /^[A-Z]$/,
  /^i$/,
  /^CI$/,
];

const allowFiles = [
  /\.spec\.ts$/,
  /\/test-results\//,
];

const findings = [];

for (const scanRoot of scanRoots) {
  walk(join(root, scanRoot));
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

if (findings.length === 0) {
  console.log('i18n audit: no hardcoded visible strings found.');
  process.exit(0);
}

console.log(`i18n audit: ${findings.length} possible hardcoded strings found.`);
for (const finding of findings.slice(0, 120)) {
  console.log(
    `${finding.file}:${finding.line} [${finding.kind}] ${JSON.stringify(finding.text)}`,
  );
}
if (findings.length > 120) {
  console.log(`...and ${findings.length - 120} more.`);
}

process.exit(strict ? 1 : 0);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(html|ts)$/.test(fullPath)) continue;
    const file = relative(root, fullPath);
    if (allowFiles.some((pattern) => pattern.test(file))) continue;

    const source = readFileSync(fullPath, 'utf8');
    const patterns = fullPath.endsWith('.html') ? htmlPatterns : tsPatterns;
    for (const pattern of patterns) {
      collectMatches(file, source, pattern.name, pattern.regex);
    }
  }
}

function collectMatches(file, source, kind, regex) {
  let match;
  while ((match = regex.exec(source)) !== null) {
    const text = normalize(match.at(-1) ?? '');
    if (!text || shouldIgnore(text)) continue;
    findings.push({
      file,
      line: lineOf(source, match.index),
      kind,
      text,
    });
  }
}

function normalize(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function shouldIgnore(text) {
  if (text.includes('{{') || text.includes('| transloco')) return true;
  if (text.startsWith('http') || text.includes('@365soft.com')) return true;
  if (/^[\d\s.,:+/#%-]+$/.test(text)) return true;
  return allowText.some((pattern) => pattern.test(text));
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}
