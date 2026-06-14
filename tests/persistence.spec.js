// These tests verify that state survives page.reload().
// The setup() helper uses __test_initialized__ so addInitScript does NOT
// clear localStorage on subsequent reloads — only on the very first page load.

const { test, expect } = require('@playwright/test');
const { setup, getDayTotalCalories } = require('./helpers');

async function waitForReactAfterReload(page) {
  await page.reload();
  await page.waitForFunction(
    () => !!document.querySelector('#root > *'),
    { timeout: 30000 }
  );
}

test.describe('localStorage persistence', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test('meal amount changes survive a page reload', async ({ page }) => {
    // Rice is input index 4 on the gym tab (meal 0, 5th ingredient)
    const riceInput = () => page.locator('input[type="number"]').nth(4);
    await expect(riceInput()).toHaveValue('75');

    await riceInput().fill('150');
    await riceInput().press('Tab');

    // Wait until useEffect has written to localStorage
    await page.waitForFunction(() => {
      try {
        const data = JSON.parse(localStorage.getItem('default:nutrition-meals-v2') || 'null');
        return data?.gym?.[0]?.[4]?.amount === 150;
      } catch { return false; }
    });

    await waitForReactAfterReload(page);
    await expect(riceInput()).toHaveValue('150');
  });

  test('language preference survives a page reload', async ({ page }) => {
    await page.getByText('🇬🇧 EN').click();
    await expect(page.getByText('ІНТЕРАКТИВНИЙ ПЛАН ХАРЧУВАННЯ')).toBeVisible();
    // useEffect writes to localStorage asynchronously after render; wait before reloading
    await page.waitForFunction(() => localStorage.getItem('nutrition-lang') === 'uk');

    await waitForReactAfterReload(page);
    await expect(page.getByText('ІНТЕРАКТИВНИЙ ПЛАН ХАРЧУВАННЯ')).toBeVisible();
  });

  test('theme preference survives a page reload', async ({ page }) => {
    await page.getByText('🌙').click();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
    // useEffect writes to localStorage asynchronously after render; wait before reloading
    await page.waitForFunction(() => localStorage.getItem('nutrition-theme') === 'light');

    await waitForReactAfterReload(page);
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  });

  test('custom food survives a page reload', async ({ page }) => {
    await page.getByRole('button', { name: '🥗 Foods' }).click();
    await page.getByRole('button', { name: /New food/ }).click();
    await page.getByPlaceholder('Food name…').fill('PersistFood');
    await page.getByRole('button', { name: '✓ Add' }).click();
    await expect(page.getByText('PersistFood')).toBeVisible();

    // Wait for the food DB useEffect to flush to localStorage before reloading
    await page.waitForFunction(() => {
      try {
        const db = JSON.parse(localStorage.getItem('default:nutrition-db-v1') || '{}');
        return Object.values(db).some(f => f.displayName === 'PersistFood');
      } catch { return false; }
    });

    await waitForReactAfterReload(page);
    await page.getByRole('button', { name: '🥗 Foods' }).click();
    await expect(page.getByText('PersistFood')).toBeVisible();
  });
});
