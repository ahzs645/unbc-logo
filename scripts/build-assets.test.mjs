import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { buildAssetModule } from './build-assets.mjs'

// src/assets/markup.js is generated from the .svg sources and committed, so that consumers get
// working artwork without a build step. This catches the failure mode that setup invites: editing
// an .svg and shipping it without regenerating, leaving the two silently out of sync.
test('the committed asset module matches its SVG sources', () => {
  const committed = readFileSync(new URL('../src/assets/markup.js', import.meta.url), 'utf8')

  assert.equal(
    committed,
    buildAssetModule(),
    'src/assets/markup.js is stale — run `npm run build:assets`'
  )
})

test('the generated module drops the empty department placeholder', () => {
  assert.ok(!buildAssetModule().includes('svgDepartmentText'))
})
