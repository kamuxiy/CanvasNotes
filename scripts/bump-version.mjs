#!/usr/bin/env node
/**
 * Bump the app version (single source of truth: package.json).
 * Vite injects this into the UI/build at compile time via __APP_VERSION__.
 *
 * Usage:
 *   node scripts/bump-version.mjs [patch|minor|major]
 *   npm run version:patch
 *
 * Run this before every GitHub content sync so Releases / About stay in sync.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const level = (process.argv[2] || 'patch').toLowerCase()

if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Usage: node scripts/bump-version.mjs [patch|minor|major]')
  process.exit(1)
}

const before = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version
execSync(`npm version ${level} --no-git-tag-version`, { cwd: root, stdio: 'inherit' })
const after = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version

console.log(`\nVersion: ${before} → ${after}`)
console.log('Source of truth: package.json')
console.log('Compile-time: Vite define __APP_VERSION__ (see vite.config.ts)')
console.log('UI About / update check: APP_META.version ← __APP_VERSION__')
console.log('electron-builder artifacts: CanvasNotes-${version}-*.exe')
console.log('\nNext: commit + push Origin, then sync the same files to GitHub.')
