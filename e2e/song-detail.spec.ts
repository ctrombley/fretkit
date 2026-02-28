import { test, expect } from '@playwright/test';
import { createNewSong, addChordWithSearch } from './helpers';

test.describe('Song Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await createNewSong(page);
  });

  test('clicking + adds a chord card', async ({ page }) => {
    await page.getByLabel('Add chord').click();
    // At least one chord card should now exist (has edit button)
    await expect(page.getByLabel('Edit chord').first()).toBeVisible();

    // Add a second chord
    await page.getByLabel('Add chord').click();
    expect(await page.getByLabel('Edit chord').count()).toBe(2);
  });

  test('pencil icon opens inline editor with search, tuning, and fret window', async ({ page }) => {
    // Add chord — auto-opens editor. Close it first.
    await page.getByLabel('Add chord').click();
    await page.getByLabel('Edit chord').first().click();
    await page.waitForTimeout(200);
    // Verify editor is closed
    await expect(page.getByPlaceholder('e.g. C major, Am7')).toHaveCount(0);

    // Now click pencil to reopen
    await page.getByLabel('Edit chord').first().click();

    // Inline editor should show search input, tuning select, fret window buttons
    const searchInput = page.getByPlaceholder('e.g. C major, Am7');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.w-64 select')).toBeVisible();
    await expect(page.locator('.w-64').getByRole('button', { name: '5' })).toBeVisible();
  });

  test('searching a chord in the editor updates the card', async ({ page }) => {
    await addChordWithSearch(page, 'Am');
    // The chord card should display "Am" or "A minor"
    await expect(page.locator('.border.rounded-lg').first()).toContainText(/Am|A minor/i);
  });

  test('chord card shows voicing arrows and V/I toggle', async ({ page }) => {
    await addChordWithSearch(page, 'C M');

    // Voicing arrows should appear on the chord card
    await expect(page.getByLabel('Previous voicing').first()).toBeVisible();
    await expect(page.getByLabel('Next voicing').first()).toBeVisible();

    // V/I toggle should exist with text "V"
    const viToggle = page.getByRole('button', { name: 'V' }).first();
    await expect(viToggle).toBeVisible();
  });

  test('V/I toggle switches between voicing and inversion mode', async ({ page }) => {
    await addChordWithSearch(page, 'C M');

    // The V/I toggle button has a title attribute about voicing/inversion mode
    const viToggle = page.locator('button[title*="Voicing mode"]');
    await expect(viToggle).toBeVisible();
    await viToggle.click();
    await page.waitForTimeout(200);

    // Now should show "I" text and title should mention "Inversion mode"
    const invToggle = page.locator('button[title*="Inversion mode"]');
    await expect(invToggle).toBeVisible();
    await expect(invToggle).toHaveText('I');

    // Arrow labels should change to inversion
    await expect(page.getByLabel('Previous inversion').first()).toBeVisible();
    await expect(page.getByLabel('Next inversion').first()).toBeVisible();
  });

  test('chord cards are draggable', async ({ page }) => {
    await addChordWithSearch(page, 'C M');
    await addChordWithSearch(page, 'G M');

    // Cards should have draggable attribute
    const draggableCards = page.locator('[draggable="true"]');
    expect(await draggableCards.count()).toBeGreaterThanOrEqual(2);

    // Drag handle should be visible (GripVertical icon with cursor-grab)
    const gripHandles = page.locator('.cursor-grab');
    expect(await gripHandles.count()).toBeGreaterThanOrEqual(2);
  });

  test('voice leading dots appear between chords with voicings', async ({ page }) => {
    await addChordWithSearch(page, 'C M');
    await addChordWithSearch(page, 'G M');
    await page.waitForTimeout(300);

    // A voice leading dot should appear between the two chords
    const dot = page.locator('[title^="Voice leading distance"]');
    await expect(dot.first()).toBeVisible();

    // The dot should contain an SVG with a colored circle
    const circle = dot.locator('svg circle');
    await expect(circle.first()).toBeVisible();
    const fill = await circle.first().getAttribute('fill');
    expect(['#22c55e', '#eab308', '#ef4444']).toContain(fill);
  });

  test('Smooth button appears with 2+ chords and toggles', async ({ page }) => {
    await addChordWithSearch(page, 'C M');
    await addChordWithSearch(page, 'G M');

    const smoothBtn = page.getByRole('button', { name: 'Smooth' });
    await expect(smoothBtn).toBeVisible();

    // Click it — should get active styling
    await smoothBtn.click();
    await expect(smoothBtn).toHaveClass(/bg-fret-green/);
  });
});
