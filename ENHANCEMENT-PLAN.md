# VAULT-MART price tracker — design review & enhancement spec

Target file: `price-tracker.html` (single-file RTL Hebrew PWA, vanilla JS, localStorage `priceTracker.v2`).
Companion files: `sw.js`, `manifest.webmanifest`, `icon-*.png`.
Constraints to preserve: single file, no build step, no dependencies, no network calls, offline-first, RTL/Hebrew, mobile-first (≈360–480px), 44px min hit targets, existing data schema + migration path, both themes (`vault`, `wopr`).

---

## PART 1 — Review findings

### A. Bugs (fix first)

**A1. `state.categories` is never initialized → crash.**
`normalizeState()` and `migrateV1()` both return `{version, products}` with no `categories` key, but `addCategory()`, `renameCategory()` and `deleteCategory()` do `state.categories.push(...)` / `.filter(...)`. Any call throws `TypeError`.
Fix: initialize `categories: []` in both builders, carry it through `normalizeState` (`Array.isArray(p.categories) ? dedupe(p.categories.map(String)) : []`), and include it in export/merge.

**A2. Category management is dead code.**
`addCategory` / `renameCategory` / `deleteCategory` exist but nothing in the UI calls them. Either wire them up (see B1) or delete them.

**A3. Search input re-renders the entire screen on every keystroke.**
`document.addEventListener("input")` on `#q` calls `render()` and then restores focus/caret manually. On a large list this drops keystrokes on mobile and fights the IME.
Fix: debounce ~120ms and re-render only the results container (`#results`), leaving the search field in the DOM untouched.

**A4. Double render on dialog save.**
Both the `submit` handler (`setTimeout(render, 0)`) and the `close` handler call `render()`. Harmless today, wasteful and a source of flicker.
Fix: render only in the `close` handler.

**A5. Category pill `data-cat=""` collides with the global `[data-cat]` click handler.**
`t.closest("[data-cat]")` matches the "הכל" pill correctly, but the same delegate would swallow any future element carrying `data-cat`. Scope to `.pill[data-cat]`.

**A6. Trend comparison uses the last two history rows regardless of store-side unit change.**
`trendOf` returns `null` when dimensions differ (correct), but returns a raw ₪ delta when *both* snapshots are unmeasured — comparing 4-packs to 1-packs as if identical. Suppress the trend badge unless both snapshots are measured, or label it "מחיר אריזה" so it is not read as a unit-price trend.

**A7. Import merge key is fragile.**
`entryKey = name|store|date|price` — re-importing the same file after a price edit duplicates the entry; two genuinely different pack sizes at the same store/date/price collapse into one. Include `qty|size|unit` in the key.

**A8. Service worker caches `./price-tracker.html` for every non-navigate miss.**
The final `.catch()` in the asset branch returns the app HTML for any failed sub-resource (e.g. a missing icon), which can hand an HTML body to an `<img>`. Return `Response.error()` for non-navigate misses.

### B. UX gaps

**B1. No way to manage categories.** Categories only exist as a side effect of typing one into a product. No rename (typos fork a category), no delete, no ordering. The logic is already written (A2) — it needs an entry point in the נתונים screen.

**B2. Comparison basis is hidden and inconsistent.** A product declares `defaultUnit`, but the seed migration guesses it from category (`CAT_UNIT`). Everything else silently becomes "ליחידה", so most migrated products show "הוסף כמות ומשקל" and never compare. The single biggest value gap in the app: **most rows can't be compared.**

**B3. Missing-data burden is invisible until you scroll.** The נתונים screen counts "ללא נתוני אריזה" but there is no way to act on it. There should be a "complete the data" flow that walks the incomplete entries one by one.

**B4. No shopping context.** The app answers "which store is cheapest for product X" but never "where should I shop today" — the actual decision. A per-store rollup (how many products this store wins, total basket) is a small computation over existing data.

**B5. Price history is buried inside an action sheet** as a text list. No sparkline, no "cheapest ever / most expensive ever" markers, no sense of whether ₪40 today is a good price for this item.

**B6. The calculator is disconnected from the catalogue.** You can't seed offer A from a stored entry, and a good verdict can't be saved back as a price entry. It's a separate island.

**B7. No undo.** Delete product / delete entry / replace-on-import are confirm-then-gone. A single-level undo toast covers 95% of accidents.

**B8. Entry form friction.** Six fields per price. Most repeat visits change only the price. `mode: "update"` helps, but the fastest path (long-press a row → type a new number → done) doesn't exist.

**B9. Empty and error states are thin.** `.empty` is one line of text; storage failure shows a banner but the app keeps accepting input that will be lost.

### C. Visual / craft notes

- **Strong, coherent aesthetic.** Amber-on-near-black terminal with scanlines is committed and consistent; the WOPR theme is a real alternate, not a hue shift. Token names are semantic (`--amber` = accent). Keep this.
- **Numeric legibility is the weak point.** Prices sit at the same size and weight as store names, so the eye has nothing to lock onto. The price is the content — it should be the largest thing in the row (tabular, ~20–22px, `font-variant-numeric: tabular-nums`) with the unit price directly under it in accent color.
- **Best-price row is under-signalled.** An 8%-alpha green wash plus a badge. Give it a start-edge accent rule (3px `--green`) and let the whole unit-price figure go `--green-bright`.
- **Hierarchy is flat overall.** Card head, notes, entry, sub-row all sit within 2–3px of each other and use the same border colour. Increase the vertical rhythm step (10 → 14px inside cards) and drop `--line-soft` further so only the card edge reads as an edge.
- **Scanline overlay costs contrast.** At `rgba(0,0,0,.28)` over 12px text on an OLED phone, `--amber-dim` (#8a7448) on `--bg-panel` is roughly 3.4:1 — below AA for body text. Lift `--amber-dim` to about `#a68d5c` and add a "reduce CRT effect" toggle next to the theme picker.
- **The `[ ... ]` bracket button convention is charming but ambiguous** at 13px on mobile; the `···` product menu is a 36px target inside a 44px minimum world. Bump to 44px.
- **Filter pills wrap to three rows** with 8 categories, pushing content below the fold on a 360px screen. Consider a collapsed "עוד ▾" after row one.
- **No loading/boot state beyond a 0.45s CSS animation** — fine for local data, keep.

### D. What is genuinely good (don't regress)

- Unit-normalization contract (`UNITS` / `BASES` / `unitPriceIn`) is clean and correctly refuses cross-dimension comparison.
- Migration v1→v2 with an auto-backup before every import, and a corrupt-data quarantine key.
- Theme applied pre-paint via an inline script — no flash.
- `askChoice` resolving on the button rather than the `close` event, with the reasoning left as a comment.
- Full keyboard/`Esc` handling on all four dialogs, `aria-pressed` / `aria-current` used correctly.
- Safe-area insets on app bar, tab bar and main.

---

## PART 2 — Enhancement plan (for Claude Code)

Implement in order. Each phase is independently shippable and must leave the app working offline as a single file.

### Phase 0 — Correctness (no visible feature change)

- [ ] **0.1** Add `categories: []` to the state shape. Initialize it in `migrateV1()` and preserve it in `normalizeState()` (dedupe, drop empties, sort). Include it in export JSON and in `mergeInto` (union).
- [ ] **0.2** Bump `state.version` to `3`, add a no-op `migrateV2toV3` that only adds `categories`. `normalizeState` must accept versions 2 and 3.
- [ ] **0.3** Fix `entryKey()` to `name|store|date|price|qty|size|unit`.
- [ ] **0.4** Remove the duplicate `render()` on dialog submit; render only on `close`.
- [ ] **0.5** Scope pill delegation to `.pill[data-cat]`.
- [ ] **0.6** `trendOf`: return `null` unless both compared snapshots are measured and same-dimension.
- [ ] **0.7** `sw.js`: non-navigate cache misses return `Response.error()`, not the app HTML. Bump `CACHE` to `vault-mart-v3-1`.
- [ ] **0.8** Split `render()` into `renderChrome()` + `renderScreen()`; give the products list its own `#results` container.

**Acceptance:** existing localStorage data loads unchanged; export → import(replace) round-trips to a byte-identical products array; no console errors on any screen.

### Phase 1 — Comparison actually works (the core value fix)

- [ ] **1.1 Inline complete-the-data flow.** Rows with `status === "missing"` get a tappable "הוסף כמות ומשקל" chip that opens the entry dialog scrolled to the qty field, pre-filled with the product's default unit.
- [ ] **1.2 "השלם נתונים" queue** on the נתונים screen: a button next to the "ללא נתוני אריזה" count that walks incomplete entries one at a time (dialog → save → next), with an "x מתוך y" progress line and a "דלג" action.
- [ ] **1.3 Basis switcher on the product card.** A small control in the card head that changes `defaultUnit` between the compatible bases (ל-100 גרם ↔ לק״ג, ל-100 מ״ל ↔ לליטר) and re-ranks live. Persist per product.
- [ ] **1.4 Pack-price fallback ranking.** When *no* entry in a product is measured, rank by total price instead of showing nothing, and label the card "השוואה: מחיר אריזה — לא מנורמל".

**Acceptance:** a fresh install from seed data shows a comparable unit price on ≥1 entry per product after completing the queue; switching basis on a kg product updates every row and the best-badge without a full page re-render.

### Phase 2 — Row/typography redesign

> Approved visual direction (from the design mockup `Price Tracker Redesign.dc.html`):
>
> **Fonts (both themes).** Load from Google Fonts: `IBM Plex Sans Hebrew` (400/500/600/700) for all Hebrew UI text; `IBM Plex Mono` (400–700) for prices, numbers and the brand line. Replace the current `--mono` body font: `body { font-family: "IBM Plex Sans Hebrew", sans-serif }`, add `--mono: "IBM Plex Mono", ui-monospace, monospace` used only on `.num`, brand, and price blocks. All prices get `font-variant-numeric: tabular-nums; direction: ltr`.
>
> **Entry row layout.** Two-column grid (`1fr auto`): start = store name (600, 15px) + badges on one line, pack label + note under it (12px, dim); end = unit price hero (700, 21px, mono) with a 11px caption beneath ("ליחידה · ₪20.00 לחבילה" — pack price is secondary). Non-best comparable rows show `+x% מהזול` in danger color as the caption. Missing-data rows show the pack price in dim + a tappable dashed-underline chip "+ השלם כמות ומשקל" in accent color.
>
> **Best row.** 3px `border-inline-start` in the best-accent color, 5–6% background wash, store + price in the bright best color, solid pill badge "★ הכי משתלם" (accent bg, dark text).
>
> **VAULT theme = 50s retro-futurist device.** Rounded everything: search is a 22px-radius pill, category pills 16px radius, cards 18px radius with `inset 1px 1px 0 rgba(255,255,255,.04)` bevel, tab bar items 14px-radius with active amber wash `rgba(255,179,71,.12)`, FAB is a chrome-ring dial (`radial-gradient(circle at 35% 30%, #1d2415, #0e120b)`, 2px amber border, amber glow). App bar is a faceplate: `linear-gradient(180deg,#161c11,#0e120b)`, small indicator LEDs (green lit + two unlit), and a decorative gauge (rounded-top arc with a needle animating `rotate(-52deg→48deg)` over 7s). Best color stays green (`#7fb069` / `#a8d98e`). Lift `--amber-dim` → `#a68d5c`, body-dim text `#b3a582`.
>
> **WOPR theme = 80s cyberpunk, warm neon only (NO blue/cyan).** Sharp corners; search/pills/FAB use `clip-path` cut corners (e.g. `polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)`); cards get corner brackets (2px red L-shapes at two opposite corners). Animated perspective grid at the bottom of the screen: repeating red gridlines masked to fade upward, `background-position` looping 28px over 3s. Brand title gets a subtle glitch keyframe (translate ±1.5px with red/peach split shadows, firing ~8% of a 5s loop). Best color is warm peach `#ffd9b0` (border, badge bg) with `#ffe6c7` text and a soft glow; danger/accent stays `#ff3b30`/`#ff7a6c`; dim text `#d3a79f`. "ONLINE" status chip in the app bar, red-bordered mono caps.
>
> **Motion (both).** Brand line types itself on load (~50ms/char) with a blinking block cursor (`step-end`, 1s); main content enters with the existing `boot` scale-in; screen switches reuse the boot animation. All gated behind `prefers-reduced-motion`.
>
> **CRT.** Default to "subtle": scanlines at ~40% of current alpha (`rgba(0,0,0,.10)`), vignette off; toggle (off/subtle/full) per task 2.5.

- [ ] **2.1** Entry row becomes a 3-zone grid: store + badges (start), pack label + note (below, `--amber-dim`), price block (end, `tabular-nums`, 20–22px `--amber-bright`) with the unit price beneath it at 13px.
- [ ] **2.2** Best row: 3px inline-start rule in `--green`, unit price in `--green-bright`, keep the ★ badge, drop the background wash to 5%.
- [ ] **2.3** Non-best rows show `+x%` as a right-aligned muted delta, not appended to a `·`-joined string.
- [ ] **2.4** Raise `--amber-dim` to `#a68d5c` (vault) / `#d3a79f` (wopr). Verify ≥4.5:1 over `--bg-panel` **with** the scanline overlay composited.
- [ ] **2.5** Add "אפקט CRT" toggle (off / subtle / full) in נתונים, stored under `priceTracker.crt`, applied pre-paint alongside the theme. `subtle` = scanlines at 40% alpha, no vignette.
- [ ] **2.6** `···` menu button → 44×44. Category pills: show first row + "עוד ▾" when they'd wrap past two rows.

**Acceptance:** screenshots at 360px and 412px, both themes, all three CRT levels; automated contrast check on `--amber-dim`, `--amber`, `--green` over `--bg-panel`.

### Phase 3 — Category management

- [ ] **3.1** New "קטגוריות" panel in נתונים: list each category with its product count and a `···` menu (rename / delete / merge into…).
- [ ] **3.2** Wire `addCategory` / `renameCategory` / `deleteCategory`; add `mergeCategory(from, to)` that reassigns products then removes the source.
- [ ] **3.3** Empty categories (created but unused) appear in the pill row in `--amber-dim` italics so they're visibly empty rather than missing.

**Acceptance:** rename propagates to all products and to the active filter; delete moves products to "ללא קטגוריה" and never deletes a product.

### Phase 4 — Store rollup ("where do I shop")

- [ ] **4.1** New screen "חנויות" (fourth tab): per store, the number of products it's cheapest on, the average `+%` above best when it isn't, and last-seen date.
- [ ] **4.2** Tapping a store filters the products list to products carrying that store.
- [ ] **4.3** "רשימת קנייה": mark products as needed (a `needed: true` flag on the product); the store rollup then shows, for the marked set only, the cheapest total per store and the best two-store split.

**Acceptance:** rollup numbers reconcile with per-card rankings; the screen renders correctly with zero marked products.

### Phase 5 — History & undo

- [ ] **5.1** Inline 40×16px CSS sparkline of unit price per entry (pure divs, no SVG, no library), plus "הזול ביותר שנרשם" / "היקר ביותר" markers in the entry sheet.
- [ ] **5.2** "מחיר טוב?" verdict on each entry: compare the current price against that entry's own history percentile — "הזול ביותר עד היום" / "מעל הממוצע".
- [ ] **5.3** Single-level undo toast (6s, bottom above the tab bar) for delete product, delete entry, import-replace, category delete. Snapshot `state` into memory before the mutation.

**Acceptance:** undo restores the exact prior state including entry order and ids; the toast never covers the tab bar or the FAB.

### Phase 6 — Calculator integration

- [ ] **6.1** "טען מהמאגר" on each calculator offer: product picker → entry picker → fills qty/size/unit/price.
- [ ] **6.2** "שמור כמחיר" on the verdict: saves the winning offer as a new entry on a chosen product.
- [ ] **6.3** Calculator state persists across tab switches (currently it does, via `calcState`) and across reloads (add to localStorage under `priceTracker.calc`, not into `state`).

---

## Implementation rules

1. **One file.** All changes land in `price-tracker.html`; only `sw.js` cache name changes outside it.
2. **No dependencies, no build, no framework.** ES5-compatible syntax as used today (`var`, function expressions) — do not modernize the existing code wholesale.
3. **Schema changes go through `normalizeState`,** with a migration and a bumped `version`. Never write a field that `normalizeState` would drop.
4. **Theme values only in `:root` and `html[data-theme=...]`** — never hardcode a colour in new CSS.
5. **All new copy in Hebrew,** matching the existing terse terminal register (`[ שמור ]`, `▸`, `★`). Numbers stay in `.num` (`direction: ltr; unicode-bidi: isolate`).
6. **Every new interactive element ≥44px** and reachable by keyboard with a visible `:focus-visible` ring.
7. **Test after each phase:** load with no localStorage (seed), with v1 data, with v2 data, with corrupt data, and with localStorage disabled (private mode).
