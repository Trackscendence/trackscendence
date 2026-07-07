#!/usr/bin/env node
// E1 - initial-route JS bundle size (audit findings F1, F2).
//
// F1 (route code-splitting) and F2 (vendor manualChunks) both shrink what the
// browser downloads on first paint. This measures the gzipped bytes actually
// pulled for the initial shell and for the /login route, using Vite's build
// manifest to follow the real static-import graph (dynamic route chunks are
// excluded, because they load lazily).
//
// It is also the seed for the E8 CI budget gate: it exits non-zero when the
// initial payload exceeds the budget, so a regression fails the build.
//
// Usage:
//   node benchmarks/e1-bundle.mjs [--budget-kb=170] [--no-build]
//
// Gzip is level 9 (matches the "min+gz" budget convention); a CDN at level 6
// will be a little larger, so treat this as the optimistic floor.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const clientDir = path.join(repoRoot, 'client')
const distDir = path.join(clientDir, 'dist')
const manifestPath = path.join(distDir, '.vite', 'manifest.json')
const resultsDir = path.join(here, 'results')

const budgetKb = Number(
  (process.argv.find((arg) => arg.startsWith('--budget-kb=')) || '=170').split(
    '=',
  )[1],
)
const budgetBytes = budgetKb * 1024

const gzipBytes = (absolutePath) =>
  gzipSync(readFileSync(absolutePath), { level: 9 }).length

// Follow a chunk's static imports transitively. dynamicImports are skipped:
// those are the lazily loaded route pages, not part of the initial payload.
const collectStaticClosure = (manifest, entryKey, seen = new Set()) => {
  if (seen.has(entryKey)) return seen
  seen.add(entryKey)
  const chunk = manifest[entryKey]
  for (const importedKey of chunk.imports || []) {
    collectStaticClosure(manifest, importedKey, seen)
  }
  return seen
}

const sumClosureBytes = (manifest, keys) => {
  let total = 0
  for (const key of keys) {
    const file = manifest[key].file
    if (file.endsWith('.js')) total += gzipBytes(path.join(distDir, file))
  }
  return total
}

const run = () => {
  if (!process.argv.includes('--no-build')) {
    console.log('Building client (vite build)...')
    execSync('npm run build', { cwd: clientDir, stdio: 'inherit' })
  }

  if (!existsSync(manifestPath)) {
    throw new Error(
      `No build manifest at ${manifestPath}. Is build.manifest enabled in vite.config.js?`,
    )
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry)
  if (!entryKey) throw new Error('No entry chunk found in manifest.')

  const shellKeys = collectStaticClosure(manifest, entryKey)
  const shellBytes = sumClosureBytes(manifest, shellKeys)

  // The /login route: the shell plus Login's own lazily loaded chunk closure.
  const loginKey = Object.keys(manifest).find((key) =>
    key.replace(/\\/g, '/').includes('pages/Login/'),
  )
  const loginKeys = loginKey
    ? collectStaticClosure(manifest, loginKey, new Set(shellKeys))
    : shellKeys
  const loginBytes = sumClosureBytes(manifest, loginKeys)

  // Per-chunk gzip sizes, largest first, so regressions are easy to spot.
  const perChunk = Object.values(manifest)
    .filter((chunk) => chunk.file.endsWith('.js'))
    .map((chunk) => ({
      file: chunk.file.replace('assets/', ''),
      gzipKb:
        Math.round((gzipBytes(path.join(distDir, chunk.file)) / 1024) * 10) /
        10,
    }))
    .sort((first, second) => second.gzipKb - first.gzipKb)

  const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10
  console.log('\nLargest JS chunks (gzip KB):')
  for (const chunk of perChunk.slice(0, 12)) {
    console.log(`  ${String(chunk.gzipKb).padStart(6)}  ${chunk.file}`)
  }

  const withinBudget = loginBytes <= budgetBytes
  console.log('')
  console.log(`Initial shell (entry + static vendors): ${kb(shellBytes)} KB gz`)
  console.log(`/login initial route JS:                ${kb(loginBytes)} KB gz`)
  console.log(`Budget:                                 ${budgetKb} KB gz`)
  console.log(withinBudget ? 'PASS: within budget.' : 'FAIL: over budget.')

  if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true })
  writeFileSync(
    path.join(resultsDir, 'e1-bundle.json'),
    JSON.stringify(
      {
        shellKb: kb(shellBytes),
        loginKb: kb(loginBytes),
        budgetKb,
        withinBudget,
        perChunk,
      },
      null,
      2,
    ) + '\n',
  )

  if (!withinBudget) process.exitCode = 1
}

run()
