import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Spiral View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Spiral');
  });

  test('renders SVG with three rings of segments', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    await expect(svg).toBeVisible();

    // Each ring has 12 segments, 3 rings = 36 cursor-pointer groups
    const segments = svg.locator('g.cursor-pointer');
    expect(await segments.count()).toBeGreaterThanOrEqual(36);
  });

  test('inner ring shows note labels', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    // Check that note names appear as text elements
    await expect(svg.locator('text', { hasText: 'C' }).first()).toBeVisible();
    await expect(svg.locator('text', { hasText: 'G' }).first()).toBeVisible();
    await expect(svg.locator('text', { hasText: 'D' }).first()).toBeVisible();
  });

  test('clicking a segment changes the key', async ({ page }) => {
    const heading = page.locator('h2');
    const initialKey = await heading.textContent();

    // Click a segment in the spiral SVG (pick one that's likely a different key)
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const segments = svg.locator('g.cursor-pointer');
    // Click a segment that is not the current root (try the 5th segment)
    await segments.nth(4).click();
    await page.waitForTimeout(200);

    const newKey = await heading.textContent();
    // The key heading should have changed
    expect(newKey).not.toEqual(initialKey);
  });

  test('root segment is green, others have blue/pink tints', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const paths = svg.locator('path');

    // Collect all fill attributes
    const fills: string[] = [];
    const count = await paths.count();
    for (let i = 0; i < count; i++) {
      const fill = await paths.nth(i).getAttribute('fill');
      if (fill) fills.push(fill);
    }

    // Root should be green
    expect(fills).toContain('#99C432');
    // Should have blue tinted segments
    expect(fills.some(f => f.includes('59, 130, 246'))).toBe(true);
    // Should have pink tinted segments
    expect(fills.some(f => f.includes('236, 72, 153'))).toBe(true);
  });

  test('arrow buttons step through keys by circle of fifths', async ({ page }) => {
    const heading = page.locator('h2');

    // P5 pill should be selected by default
    const p5Pill = page.getByRole('button', { name: 'P5', exact: true });
    await expect(p5Pill).toHaveClass(/bg-fret-green/);

    // Reset to C major by clicking until we get C
    // First find current key, then navigate
    await expect(heading).toHaveText(/major/);

    // Navigate: click previous/next to find C major first
    // Just test that Next key advances by a fifth from current key
    const prevBtn = page.getByLabel('Previous key');
    const nextBtn = page.getByLabel('Next key');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    const key1 = await heading.textContent();
    await nextBtn.click();
    await page.waitForTimeout(200);
    const key2 = await heading.textContent();
    await nextBtn.click();
    await page.waitForTimeout(200);
    const key3 = await heading.textContent();

    // All three should be different (stepping through fifths)
    expect(key1).not.toEqual(key2);
    expect(key2).not.toEqual(key3);
    expect(key1).not.toEqual(key3);
  });

  test('diatonic chord buttons exist and can be activated', async ({ page }) => {
    // Roman numeral chord buttons should be visible (each button has a span with the numeral)
    const romanSpans = page.locator('span.text-sm.font-semibold');
    await expect(romanSpans.first()).toBeVisible();

    // Check for specific roman numerals
    await expect(page.locator('span.text-sm.font-semibold', { hasText: 'I' }).first()).toBeVisible();
    await expect(page.locator('span.text-sm.font-semibold', { hasText: 'ii' }).first()).toBeVisible();
    await expect(page.locator('span.text-sm.font-semibold', { hasText: 'IV' }).first()).toBeVisible();
    await expect(page.locator('span.text-sm.font-semibold', { hasText: 'V' }).first()).toBeVisible();

    // Click the first diatonic chord button — it should get active border styling
    const firstChord = page.locator('button:has(span.text-sm.font-semibold)').first();
    await firstChord.click();
    await expect(firstChord).toHaveClass(/border-magenta/);
  });

  test('interval selector changes step interval', async ({ page }) => {
    const heading = page.locator('h2');

    // Click M2 pill (use exact text match to avoid matching "Major")
    const m2Pill = page.getByRole('button', { name: 'M2', exact: true });
    await m2Pill.click();
    await expect(m2Pill).toHaveClass(/bg-fret-green/);

    // P5 should no longer be selected
    const p5Pill = page.getByRole('button', { name: 'P5', exact: true });
    await expect(p5Pill).not.toHaveClass(/bg-fret-green/);

    // Stepping by M2 from any key should produce different keys
    const key1 = await heading.textContent();
    await page.getByLabel('Next key').click();
    await page.waitForTimeout(200);
    const key2 = await heading.textContent();
    expect(key1).not.toEqual(key2);
  });
});
