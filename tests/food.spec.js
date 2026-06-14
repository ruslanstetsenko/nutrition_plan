const { test, expect } = require('@playwright/test');
const { setup } = require('./helpers');

test.describe('Food database management', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.getByRole('button', { name: '🥗 Foods' }).click();
  });

  test('can add a new custom food and it appears in the list', async ({ page }) => {
    await page.getByRole('button', { name: /New food/ }).click();

    await page.getByPlaceholder('Food name…').fill('Test Protein');

    // The add form is the container holding the name input.
    // Its 3 number inputs are P, F, C in order.
    const addForm = page.locator('div').filter({ has: page.getByPlaceholder('Food name…') }).last();
    await addForm.locator('input[type="number"]').nth(0).fill('25'); // protein
    await addForm.locator('input[type="number"]').nth(1).fill('5');  // fat
    await addForm.locator('input[type="number"]').nth(2).fill('0');  // carbs

    // Auto-calculated kcal preview: 25*4 + 5*9 + 0*4 = 145
    await expect(page.getByText('145 kcal')).toBeVisible();

    await page.getByRole('button', { name: '✓ Add' }).click();

    await expect(page.getByText('Test Protein')).toBeVisible();
  });

  test('can search foods by name', async ({ page }) => {
    await page.getByPlaceholder('🔍 Search food…').fill('rice');
    await expect(page.getByText('White rice')).toBeVisible();
    // Eggs do not match "rice" so their card should be gone
    await expect(page.getByText('Eggs')).toHaveCount(0);
  });

  test('can filter foods by category', async ({ page }) => {
    await page.getByRole('button', { name: 'Protein' }).click();
    await expect(page.getByText('Pork chop')).toBeVisible();
    await expect(page.getByText('Fish / Salmon')).toBeVisible();
    // dairy items should not appear in protein filter
    await expect(page.getByText('Greek yogurt')).toHaveCount(0);
  });

  test('can edit macros of an existing food', async ({ page }) => {
    // Search to isolate the rice card so the first number input is unambiguous
    await page.getByPlaceholder('🔍 Search food…').fill('White rice');
    const proteinInput = page.locator('input[type="number"]').first();
    await proteinInput.fill('10');
    await proteinInput.press('Tab');

    // Navigate to gym tab — day total should be higher than default 2520
    // rice protein 6.8→10 at 75g: delta=(10-6.8)*0.75*4 ≈ +9.6 cal → total ~2530
    await page.getByRole('button', { name: '🏋️ Gym Days' }).click();
    const total = await page.evaluate(() => {
      const divs = [...document.querySelectorAll('div')];
      const label = divs.find(d => d.textContent.trim() === 'CALORIES' && d.children.length === 0);
      return label ? Number(label.previousElementSibling?.textContent) : null;
    });
    expect(total).toBeGreaterThan(2520);
  });

  test('can delete a custom food', async ({ page }) => {
    // Add a food first
    await page.getByRole('button', { name: /New food/ }).click();
    await page.getByPlaceholder('Food name…').fill('DeleteMe');
    await page.getByRole('button', { name: '✓ Add' }).click();
    await expect(page.getByText('DeleteMe')).toBeVisible();

    // Delete it
    const deleteBtn = page.locator('button', { hasText: '🗑 delete' }).last();
    await deleteBtn.click();
    await expect(page.getByText('DeleteMe')).toHaveCount(0);
  });

  test('reset restores original macros for built-in food', async ({ page }) => {
    // Search to isolate the rice card
    await page.getByPlaceholder('🔍 Search food…').fill('White rice');
    const proteinInput = page.locator('input[type="number"]').first();

    await proteinInput.fill('99');
    await proteinInput.press('Tab');

    await page.getByRole('button', { name: '↺ original' }).click();
    await expect(proteinInput).toHaveValue('6.8');
  });
});
