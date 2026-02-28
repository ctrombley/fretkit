import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

test.describe('Overtone View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateTo(page, 'Overtones');
  });

  test('renders overtone spiral SVG with harmonic nodes', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    await expect(svg).toBeVisible();

    // Harmonic nodes should exist (circles with cursor-pointer parent groups)
    const nodes = svg.locator('g.cursor-pointer');
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test('title shows overtone series with root note', async ({ page }) => {
    const heading = page.locator('h2');
    await expect(heading).toContainText('Overtone Series');
    // Should include a note name like C2
    await expect(heading).toContainText(/[A-G]/);
  });

  test('hovering a harmonic node shows frequency info', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const nodes = svg.locator('g.cursor-pointer');
    await expect(nodes.first()).toBeVisible();

    // Hover over the first harmonic node
    await nodes.first().hover();
    await page.waitForTimeout(300);

    // Info panel should appear with frequency in Hz
    const infoPanel = svg.locator('foreignObject');
    await expect(infoPanel).toBeVisible();
    await expect(infoPanel).toContainText('Hz');
  });

  test('inner nodes are closer to center than outer nodes', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const circles = svg.locator('g.cursor-pointer circle');
    const count = await circles.count();
    expect(count).toBeGreaterThan(1);

    // Get position of first harmonic (should be closest to center)
    const firstCx = parseFloat(await circles.first().getAttribute('cx') ?? '0');
    const firstCy = parseFloat(await circles.first().getAttribute('cy') ?? '0');
    const firstDist = Math.sqrt((firstCx - 250) ** 2 + (firstCy - 250) ** 2);

    // Get position of last harmonic (should be farther from center)
    const lastCx = parseFloat(await circles.last().getAttribute('cx') ?? '0');
    const lastCy = parseFloat(await circles.last().getAttribute('cy') ?? '0');
    const lastDist = Math.sqrt((lastCx - 250) ** 2 + (lastCy - 250) ** 2);

    expect(lastDist).toBeGreaterThan(firstDist);
  });

  test('Show ET toggle adds and removes ET reference points', async ({ page }) => {
    // "Show ET" checkbox should exist
    const showEtCheckbox = page.locator('label', { hasText: 'Show ET' }).locator('input[type="checkbox"]');
    await expect(showEtCheckbox).toBeVisible();
    await expect(showEtCheckbox).not.toBeChecked();

    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const circlesBefore = await svg.locator('circle').count();

    // Check the Show ET checkbox
    await showEtCheckbox.check();
    await page.waitForTimeout(200);

    // More circles should appear (ET reference points)
    const circlesAfter = await svg.locator('circle').count();
    expect(circlesAfter).toBeGreaterThan(circlesBefore);

    // Uncheck — circles should decrease back
    await showEtCheckbox.uncheck();
    await page.waitForTimeout(200);
    const circlesAfterUncheck = await svg.locator('circle').count();
    expect(circlesAfterUncheck).toBeLessThan(circlesAfter);
  });

  test('JI/ET mode toggle switches between modes', async ({ page }) => {
    // JI should be active by default
    const jiBtn = page.getByRole('button', { name: 'JI', exact: true });
    const etBtn = page.getByRole('button', { name: 'ET', exact: true });
    await expect(jiBtn).toHaveClass(/bg-white/);

    // Switch to ET
    await etBtn.click();
    await expect(etBtn).toHaveClass(/bg-white/);
    await expect(jiBtn).not.toHaveClass(/bg-white/);

    // Switch back to JI
    await jiBtn.click();
    await expect(jiBtn).toHaveClass(/bg-white/);
  });

  test('ET mode changes node positions (snaps to ET grid)', async ({ page }) => {
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    const circles = svg.locator('g.cursor-pointer circle');

    // Record positions in JI mode
    const jiPositions: string[] = [];
    const count = Math.min(await circles.count(), 5);
    for (let i = 0; i < count; i++) {
      const cx = await circles.nth(i).getAttribute('cx');
      const cy = await circles.nth(i).getAttribute('cy');
      jiPositions.push(`${cx},${cy}`);
    }

    // Switch to ET mode
    await page.getByRole('button', { name: 'ET', exact: true }).click();
    await page.waitForTimeout(300);

    // Record positions in ET mode
    const etPositions: string[] = [];
    const etCircles = svg.locator('g.cursor-pointer circle');
    const etCount = Math.min(await etCircles.count(), 5);
    for (let i = 0; i < etCount; i++) {
      const cx = await etCircles.nth(i).getAttribute('cx');
      const cy = await etCircles.nth(i).getAttribute('cy');
      etPositions.push(`${cx},${cy}`);
    }

    // At least some positions should differ between JI and ET
    const hasDifference = jiPositions.some((pos, i) => i < etPositions.length && pos !== etPositions[i]);
    expect(hasDifference).toBe(true);
  });

  test('Derive mode shows derivation ring', async ({ page }) => {
    const deriveBtn = page.getByRole('button', { name: 'Derive' });
    await deriveBtn.click();
    await page.waitForTimeout(300);

    // DerivationRing SVG should appear
    const svg = page.locator('svg[viewBox="0 0 500 500"]');
    await expect(svg).toBeVisible();

    // Heading should change to reflect derivation mode
    const heading = page.locator('h2');
    await expect(heading).toContainText('Derivation');
  });

  test('Derive mode help text mentions inner dots and comma gap', async ({ page }) => {
    await page.getByRole('button', { name: 'Derive' }).click();
    await page.waitForTimeout(200);

    // The help caption should mention derivation-specific terms
    const helpText = page.locator('p.text-xs.text-gray-400');
    await expect(helpText).toContainText(/comma/i);
  });
});
