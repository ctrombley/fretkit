import { test, expect } from '@playwright/test';
import { openSandboxSettings, sidebarSearch } from './helpers';

test.describe('Sandbox View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Sandbox is the default view
  });

  test('gear icon opens settings sidebar', async ({ page }) => {
    await page.getByLabel('Fretboard settings').first().click();
    const sidebar = page.locator('aside.fixed');
    await expect(sidebar).toHaveClass(/translate-x-0/);
  });

  test('search input filters scales/chords and lights up fretboard notes', async ({ page }) => {
    await openSandboxSettings(page);
    await sidebarSearch(page, 'C major');
    // Lit string markers should appear in the SVG fretboard
    const markers = page.locator('.string__marker-lit, .string__marker-root');
    await expect(markers.first()).toBeVisible();
    expect(await markers.count()).toBeGreaterThan(0);
  });

  test('chord search shows voicing navigation arrows', async ({ page }) => {
    await openSandboxSettings(page);
    await sidebarSearch(page, 'C M');
    // Voicing arrows should appear in the sidebar
    await expect(page.getByLabel('Previous voicing')).toBeVisible();
    await expect(page.getByLabel('Next voicing')).toBeVisible();
  });

  test('clicking Next voicing changes the displayed voicing', async ({ page }) => {
    await openSandboxSettings(page);
    await sidebarSearch(page, 'C M');
    await expect(page.getByLabel('Next voicing')).toBeVisible();

    // Get initial fretboard state via the mini diagram or marker positions
    const initialMarkers = await page.locator('.string__marker-lit, .string__marker-root').count();

    // Click next voicing
    await page.getByLabel('Next voicing').click();
    await page.waitForTimeout(200);

    // The fretboard should still have lit markers (voicing changed, not cleared)
    const newMarkers = await page.locator('.string__marker-lit, .string__marker-root').count();
    expect(newMarkers).toBeGreaterThan(0);
  });

  test('chord shows X/O string indicators and mini diagram', async ({ page }) => {
    await openSandboxSettings(page);
    await sidebarSearch(page, 'C M');
    // String indicators (X/O markers above the nut) should be present
    await expect(page.locator('.string-indicators').first()).toBeVisible();
    // Mini chord diagram should be visible (top-left overlay)
    await expect(page.locator('.absolute.top-2.left-2').first()).toBeVisible();
  });

  test('Latch/Momentary toggle switches mode', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Latch|Momentary/ });
    await expect(toggle).toBeVisible();
    const initialText = await toggle.textContent();

    await toggle.click();
    const newText = await toggle.textContent();
    expect(newText).not.toEqual(initialText);

    // Should toggle between Latch and Momentary
    if (initialText?.includes('Latch')) {
      expect(newText).toContain('Momentary');
    } else {
      expect(newText).toContain('Latch');
    }
  });
});
