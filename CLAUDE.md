# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

Open `index.html` directly in a browser — no build step, no server required. Alternatively, use any local static server:

```bash
python3 -m http.server 8080
```

There is no linter. All dependencies (React 18, ReactDOM, Babel) load from CDN at runtime.

## Running UI tests

Tests use Playwright. Install browsers once with `npx playwright install`, then:

```bash
npm test            # headless (CI mode)
npm run test:ui     # interactive Playwright UI (best for manual exploration)
npm run test:headed # headed browser (watch tests run live)
```

Test files live in `tests/`: `navigation.spec.js`, `food.spec.js`, `macros.spec.js`, `persistence.spec.js`, `helpers.js`.

## Architecture

The entire application is a **single file**: `index.html`. It contains:

- Global CSS in `<style>` (minimal, mostly scrollbar and animation rules)
- Vanilla JS for export/import/clear in the first `<script>` block
- All React JSX in a `<script type="text/babel">` block parsed at runtime by Babel standalone

### Data model

**Food database** (`DB_FACTORY()`): keyed object of foods with `{p, f, c, unit, cat, label?, gPerPc?, displayName?}`. Macros are always per 100g/100ml/1pc. Calories are always computed as `p*4 + f*9 + c*4` — never stored.

**State shape in `App`**:
- `meals` — `{gym: [meal0Items, meal1Items, meal2Items], rest: [...]}` where each meal is an array of `{key, amount, uid}`
- `mealRecs` — `{gym: [meal0Refs, ...], rest: [...]}` where each ref is `{id, scale, uid}` pointing to a recipe
- `recipes` — array of `{id, name, emoji, ingredients: [{key, amount}]}`
- `db` — food database merged with `DB_FACTORY()` base (custom foods added, macros overridable)
- `calcData` — TDEE calculator settings object or `null`
- `profiles` — array of `{id, name, emoji}`

**localStorage keys** are generated per-profile by `skFor(profileId)`:  
`{profileId}:nutrition-meals-v2`, `nutrition-db-v1`, `nutrition-recipes-v1`, `nutrition-meal-recipes-v1`, `nutrition-calc-v1`

Global keys (profile-independent): `nutrition-profiles-v1`, `nutrition-active-profile`, `nutrition-lang`, `nutrition-theme`.

### Theme / color system

`C` is a **global mutable object** (not React context). `applyTheme(theme)` mutates `C` in place and sets `document.body[data-theme]`. All components reference `C.*` directly — they pick up the new values on the next render triggered by parent state change. The `key={theme}` prop on the root `<div>` in `App` forces a full subtree remount on theme toggle.

### Internationalization

`TR` object holds `en` and `uk` translation dictionaries. The active translation `t = TR[lang]` is passed as a prop through the entire component tree. Language is toggled at runtime and persisted to `localStorage`.

### Component tree

```
App
├── Toast               — temporary notification overlay
├── ProfileScreen       — shown when showProfiles=true (replaces main UI)
├── MealCard            — one meal on gym/rest tab
│   ├── IngRow          — single food ingredient row
│   ├── FoodPicker      — food search dropdown (add food to meal)
│   ├── RecipeRow       — recipe in a meal with scale factor
│   └── RecipePicker    — recipe search dropdown
├── DayTotal            — day macro summary + target comparison
├── FoodTab             — food DB editor
│   └── FoodCard        — individual food edit card
├── RecipesTab          — recipe list
│   └── RecipeEditor    — modal for creating/editing recipes
├── SuppsTab            — static supplement info
├── ShopTab             — weekly shopping list
└── CalcTab             — TDEE + macro calculator
```

### Key helpers

- `calcFood(key, amount, db)` → `{cal, p, f, c}` for a food entry
- `calcRecipeMacros(recipe, db)` → totals a recipe's ingredients
- `sumMacros(items)` → reduces an array of `{cal,p,f,c}`
- `BUILTIN` / `BUILTIN_UIDS` — the default meal plan; used to detect modifications and restore defaults
- `genUid()` — random 7-char string used as item UIDs
- `btnStyle(color, small)` — returns a consistent inline style object for buttons

### Styling convention

All component styles are inline objects. `btnStyle(C.color, sm)` produces the standard pill-button style. There are no CSS class names in JSX — only the sync bar at the bottom uses class names defined in the global `<style>` block.
