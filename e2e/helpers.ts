import { type Page, expect } from '@playwright/test';

/** Click a header nav button by visible text */
export async function navigateTo(page: Page, viewName: 'Sandbox' | 'Songs' | 'Spiral' | 'Overtones') {
  await page.getByRole('button', { name: viewName }).click();
}

/** Open the sandbox settings sidebar for the first fretboard */
export async function openSandboxSettings(page: Page) {
  await page.getByLabel('Fretboard settings').first().click();
  // Wait for sidebar to slide in
  await expect(page.locator('aside.fixed')).toHaveClass(/translate-x-0/);
}

/** Search for a chord/scale in the sidebar's search input */
export async function sidebarSearch(page: Page, query: string) {
  const input = page.locator('aside.fixed input[type="search"]');
  await input.fill(query);
  // Small wait for reactive update
  await page.waitForTimeout(300);
}

/** Navigate to Songs, create a new song, and return to the detail view */
export async function createNewSong(page: Page) {
  await navigateTo(page, 'Songs');
  await page.getByRole('button', { name: 'New Song' }).click();
  // Should navigate to song detail view
  await expect(page.getByLabel('Add chord')).toBeVisible();
}

/** Add a chord card and set its search term, then close the editor.
 *  addChordToSong automatically sets the new chord as active (editing),
 *  so the ChordEditor is already visible — no need to click "Edit chord". */
export async function addChordWithSearch(page: Page, searchTerm: string) {
  await page.getByLabel('Add chord').click();
  // The new chord is auto-selected for editing; wait for ChordEditor to appear
  const searchInput = page.getByPlaceholder('e.g. C major, Am7').last();
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(400);
  // Close the editor by clicking the edit button (toggles editing off)
  await page.getByLabel('Edit chord').last().click();
  await page.waitForTimeout(200);
}
