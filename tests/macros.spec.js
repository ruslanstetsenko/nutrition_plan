// Macro calculations — default gym day breakdown:
//
// Meal 0 (Post-Workout): eggs×4(310) + banana×1(99) + yogurt×150g(85) + nuts×20g(120) + rice×75g(241) = 855
// Meal 1 (Lunch):        pork×200g(281) + rice×80g(257) + oil×10ml(90) + veg×150g(36) + milk×200ml(76) + sugar×10g(40) = 780
// Meal 2 (Dinner):       pork×200g(281) + cottage×250g(260) + kefir×300ml(83) + protein×35g(130) + sweet_potato×150g(131) = 885
// Day total: 2520 cal
//
// Input order within the gym tab (all meal cards open by default):
//   [0]=eggs, [1]=banana, [2]=yogurt, [3]=nuts, [4]=rice  (meal 0)
//   [5]=pork, [6]=rice, [7]=oil, [8]=veg, [9]=milk, [10]=sugar  (meal 1)
//   [11]=pork, [12]=cottage, [13]=kefir, [14]=protein, [15]=sweet_potato  (meal 2)

const { test, expect } = require('@playwright/test');
const { setup, getDayTotalCalories } = require('./helpers');

test.describe('Macro calculations', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test('default gym day total is 2520 cal', async ({ page }) => {
    const total = await getDayTotalCalories(page);
    expect(total).toBe(2520);
  });

  test('doubling eggs (4→8 pcs) adds exactly 310 cal to day total', async ({ page }) => {
    // eggs: p=13, f=11, c=1 per 100g, gPerPc=50
    // 4 pcs=200g: cal=Math.round(26*4+22*9+2*4)=310
    // 8 pcs=400g: cal=Math.round(52*4+44*9+4*4)=620 → delta=310
    const before = await getDayTotalCalories(page);

    const eggsInput = page.locator('input[type="number"]').nth(0);
    await expect(eggsInput).toHaveValue('4');
    await eggsInput.fill('8');
    await eggsInput.press('Tab');

    const after = await getDayTotalCalories(page);
    expect(after).toBe(before + 310);
  });

  test('zeroing rice in meal 0 (75g→0) removes 241 cal from day total', async ({ page }) => {
    const before = await getDayTotalCalories(page);

    const riceInput = page.locator('input[type="number"]').nth(4);
    await expect(riceInput).toHaveValue('75');
    await riceInput.fill('0');
    await riceInput.press('Tab');

    const after = await getDayTotalCalories(page);
    expect(after).toBe(before - 241);
  });

  test('per-item macro display updates immediately when amount changes', async ({ page }) => {
    // nuts: p=18, f=50, c=20 per 100g
    // 20g: cal=Math.round(3.6*4+10*9+4*4)=120, p=3.6
    // 40g: cal=Math.round(7.2*4+20*9+8*4)=241, p=7.2
    const nutsInput = page.locator('input[type="number"]').nth(3);
    await expect(nutsInput).toHaveValue('20');
    await expect(page.getByText(/120 cal · P:3\.6g/)).toBeVisible();

    await nutsInput.fill('40');
    await nutsInput.press('Tab');

    await expect(page.getByText(/241 cal · P:7\.2g/)).toBeVisible();
  });

  test('removing a food item from a meal decreases the total', async ({ page }) => {
    const before = await getDayTotalCalories(page);

    // Click the × button on the first food item (eggs) in meal 0
    await page.locator('button', { hasText: '×' }).first().click();

    const after = await getDayTotalCalories(page);
    expect(after).toBeLessThan(before);
    expect(after).toBe(before - 310); // eggs at 4 pcs = 310 cal
  });
});
