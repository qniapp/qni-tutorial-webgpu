import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import corrections from './fixtures/bb84-text-corrections.json' with { type: 'json' }

const orbitScript = '<script is:inline type="module" src="https://js.withorbit.com/orbit-web-component.js"></script>'

for (const fixture of corrections.pages) {
  test(`${fixture.slug}: only the explicitly authorized sentences change in source`, () => {
    let source = readFileSync(new URL(`../src/pages/${fixture.slug}.astro`, import.meta.url), 'utf8')
    // The baseline predates removing the Orbit script tag (Orbit shut down; docs/quiz-spec.md).
    if (fixture.slug === 'bb84_circuit') source = source.replace('\n</TutorialLayout>', `\n${orbitScript}\n</TutorialLayout>`)
    for (const edit of fixture.edits) {
      expect(source.split(edit.after)).toHaveLength(2)
      source = source.replace(edit.after, edit.before)
    }
    expect(createHash('sha256').update(source).digest('hex')).toBe(fixture.baselineSourceSha256)
  })
}
