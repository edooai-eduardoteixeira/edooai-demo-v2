import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const GSTACK_DIR = join(process.env.HOME || '/root', '.claude/skills/gstack');
const PLAYWRIGHT_CACHE = join(process.env.HOME || '/root', '.cache/ms-playwright');

describe('Playwright browser version match', () => {
  it('installed playwright-core chromium revision matches cached browser', () => {
    const browsersJsonPath = join(GSTACK_DIR, 'node_modules/playwright-core/browsers.json');
    if (!existsSync(browsersJsonPath)) {
      console.log('Skipping: playwright-core not installed at', browsersJsonPath);
      return;
    }

    const browsers = JSON.parse(readFileSync(browsersJsonPath, 'utf8'));
    const chromium = browsers.browsers.find(b => b.name === 'chromium');
    expect(chromium).toBeDefined();

    const expectedRevision = chromium.revision;
    const cachedDir = join(PLAYWRIGHT_CACHE, `chromium-${expectedRevision}`);

    expect(
      existsSync(cachedDir),
      `Playwright expects chromium v${expectedRevision} but ${cachedDir} does not exist. ` +
      `Cached versions: ${existsSync(PLAYWRIGHT_CACHE) ? readdirSync(PLAYWRIGHT_CACHE).filter(d => d.startsWith('chromium-')).join(', ') : 'none'}. ` +
      `Fix: pin playwright version in gstack package.json to match cached browsers.`
    ).toBe(true);
  });

  it('NO_PROXY does not block Playwright CDN redirects when stripped', () => {
    const noProxy = process.env.NO_PROXY || '';
    if (!noProxy) {
      console.log('Skipping: NO_PROXY not set (not in cloud container)');
      return;
    }

    // Verify that *.googleapis.com is in NO_PROXY (the known issue)
    const hasGoogleapis = noProxy.includes('googleapis.com');
    if (hasGoogleapis) {
      // The session-start hook should strip this before running playwright install
      const stripped = noProxy
        .split(',')
        .filter(entry => !entry.includes('googleapis.com'))
        .join(',');

      expect(stripped).not.toContain('googleapis.com');
      console.log(`NO_PROXY contains googleapis.com. Session-start hook must strip it for Playwright downloads.`);
      console.log(`Original: ${noProxy.substring(0, 100)}...`);
      console.log(`Stripped: ${stripped}`);
    }
  });
});
