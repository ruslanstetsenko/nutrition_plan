const { test, expect } = require('@playwright/test');
const { setup } = require('./helpers');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test('gym tab is shown by default with 3 meals', async ({ page }) => {
    await expect(page.getByText('Post-Workout (10:00)')).toBeVisible();
    await expect(page.getByText('Lunch (14:00)')).toBeVisible();
    await expect(page.getByText('Dinner (18:00)')).toBeVisible();
  });

  test('rest tab shows breakfast instead of post-workout', async ({ page }) => {
    await page.getByRole('button', { name: '🛋️ Rest Days' }).click();
    await expect(page.getByText('Breakfast (10:00)')).toBeVisible();
    await expect(page.getByText('Post-Workout (10:00)')).toHaveCount(0);
  });

  test('supplements tab lists science-backed supplements', async ({ page }) => {
    await page.getByRole('button', { name: '💊 Supplements' }).click();
    await expect(page.getByText('Creatine Monohydrate')).toBeVisible();
    await expect(page.getByText('Vitamin D3')).toBeVisible();
    await expect(page.getByText('Magnesium Glycinate')).toBeVisible();
    await expect(page.getByText('Omega-3')).toBeVisible();
  });

  test('foods tab shows built-in food database', async ({ page }) => {
    await page.getByRole('button', { name: '🥗 Foods' }).click();
    await expect(page.getByText('White rice')).toBeVisible();
    await expect(page.getByText('Eggs')).toBeVisible();
    await expect(page.getByText('Pork chop')).toBeVisible();
  });

  test('recipes tab starts empty', async ({ page }) => {
    await page.getByRole('button', { name: '🍳 Recipes' }).click();
    await expect(page.getByText('No recipes yet.')).toBeVisible();
  });

  test('calculator tab renders parameter inputs', async ({ page }) => {
    // Use getByRole to avoid matching "⚡ Calculator" in the DayTotal hint text
    await page.getByRole('button', { name: '⚡ Calculator' }).click();
    await expect(page.getByText('Age (years)')).toBeVisible();
    await expect(page.getByText('Weight (kg)')).toBeVisible();
    await expect(page.getByText('BMR (basal metabolic rate)')).toBeVisible();
  });
});
