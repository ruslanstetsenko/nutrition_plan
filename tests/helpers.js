// addInitScript runs before every page load, including page.reload().
// The __test_initialized__ flag prevents clearing localStorage on reloads,
// which is required for persistence tests to work correctly.
async function setup(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('__test_initialized__')) {
      const keys = Object.keys(localStorage).filter(
        k => k.startsWith('nutrition-') || k.includes(':nutrition-')
      );
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('nutrition-lang', 'en');
      localStorage.setItem('nutrition-theme', 'dark');
      localStorage.setItem('__test_initialized__', '1');
    }
  });
  // 'load' waits until CDN scripts have downloaded and executed.
  // Babel then compiles JSX synchronously, React renders after.
  await page.goto('/', { waitUntil: 'load', timeout: 60000 });
  // Wait for React to mount something in #root (more reliable than text match)
  await page.waitForFunction(
    () => !!document.querySelector('#root > *'),
    { timeout: 30000 }
  );
}

// Returns the day total calorie value shown on the current gym/rest tab.
// Locates the "CALORIES" label div and reads its previous sibling's number.
async function getDayTotalCalories(page) {
  return page.evaluate(() => {
    const divs = [...document.querySelectorAll('div')];
    const label = divs.find(d => d.textContent.trim() === 'CALORIES' && d.children.length === 0);
    const prev = label?.previousElementSibling;
    return prev ? Number(prev.textContent.trim()) : null;
  });
}

module.exports = { setup, getDayTotalCalories };
