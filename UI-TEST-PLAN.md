# VAULT-MART — UI / end-to-end test plan

Target: `http://localhost:8123/price-tracker-v3.html`
Scope: **interface behaviour only.** Pure logic (unit-price maths, migration, merge)
is already covered by the in-app suite — run `__selftest()` in the console for that.
This plan covers what that suite structurally cannot see: real clicks, real dialogs,
focus, layout, and the things that actually broke in the past
(a dead `close` event, a jammed cancel button, sub-44px targets, amber hover in a red theme).

## Ground rules for the tester

1. **Never assume a click worked.** After every action, assert the resulting DOM state.
2. **Reset between sections** by loading `?v=<timestamp>` with a cache-buster.
3. **Do not leave test data behind.** Undo or delete what you create.
4. Report every failure as: what you did → what you expected → what you saw.
5. If a step is impossible (control missing), that is itself a **FAIL** — report it.
6. Take a screenshot for any visual/layout failure.

## Setup

- Viewport: 412×915 (Samsung Ultra class). Repeat section F at 360×800.
- Start on the VAULT theme, CRT = subtle.

---

## A. Dialogs — the historical weak spot

| # | Steps | Expected |
|---|-------|----------|
| A1 | Tap FAB → tap `[ ביטול ]` on the empty product dialog | Dialog closes. No product added. |
| A2 | Tap FAB → type a name → `[ ביטול ]` | Dialog closes, product NOT saved, name not in list. |
| A3 | Tap FAB → type a name → `[ שמור ]` | Dialog closes, product appears at top of list, persists after reload. |
| A4 | Tap FAB → `[ שמור ]` with empty name | Dialog stays open; browser or inline error shown; nothing saved. |
| A5 | Open any product ··· → מחק → confirm | Product gone AND an undo toast appears. |
| A6 | Press `Esc` on each dialog (product, price, action sheet, confirm) | Each closes without mutating data. |
| A7 | On a price row → ··· → ערוך → change price → שמור | Row shows the new price; history length unchanged (edit overwrites). |
| A8 | On a price row → עדכן מחיר → new price → שמור | New price shown; history grew by one (check via console `JSON.parse(localStorage['priceTracker.v2'])`). |

## B. Undo

| # | Steps | Expected |
|---|-------|----------|
| B1 | Delete a product → tap `[ בטל ]` | Product restored with all its price rows and ids identical. |
| B2 | Delete a price row → `[ בטל ]` | Row restored in the same position. |
| B3 | Delete a product → wait 7 seconds | Toast auto-dismisses; deletion stands. |
| B4 | While a toast is visible, check overlap | Toast must not cover the tab bar or the FAB dial. |
| B5 | Delete a category (נתונים) → `[ בטל ]` | Category and product assignments restored. |

## C. Complete-the-data flow (the core value path)

| # | Steps | Expected |
|---|-------|----------|
| C1 | Find a row showing "+ השלם כמות ומשקל" and tap the chip | Price dialog opens with focus in the **quantity** field. |
| C2 | Enter qty 4, size 98, unit גרם → שמור | Row now shows a unit price hero (₪x.xx) and the card header stops saying "לא מנורמל". |
| C3 | נתונים → `[ השלם נתונים · N ]` | Dialog opens titled "השלמת נתונים 1 מתוך N". |
| C4 | Tap `[ דלג ]` | Advances to "2 מתוך N" without saving. |
| C5 | Fill one and save | Advances to the next; the count in the title is stable. |
| C6 | Tap `[ ביטול ]` mid-queue | Queue ends, app returns to a normal screen, no data lost. |

## D. Comparison correctness in the UI

| # | Steps | Expected |
|---|-------|----------|
| D1 | Create product "בדיקה" (unit: גרם), add 4×98g @ 24.90 and 8×98g @ 40.00 | 8-pack row shows **₪5.10**, 4-pack **₪6.35**, ★ on the 8-pack, `+24.5%` on the other. |
| D2 | Tap the basis button in the card head | Switches to ₪51.02 / ₪63.52 per ק״ג; ★ stays on the same row. |
| D3 | Add a third row with unit יחידות | That row shows "לא ניתן להשוות" and gets **no** ★. |
| D4 | Delete the two measured rows, leaving only unmeasured ones | Card header reads "השוואה: מחיר אריזה — לא מנורמל" and the cheapest gets "הזול באריזה" — **never** a green ★. |
| D5 | Clean up: delete "בדיקה" | Gone. |

## E. Stores screen

| # | Steps | Expected |
|---|-------|----------|
| E1 | Mark 2 products via ··· → "צמן: צריך לקנות" (label starts ☐) | Card title gains a 🛒 marker. |
| E2 | Go to חנויות | Shopping list lists stores with totals; partial-coverage stores show an `x/y` badge. |
| E3 | Check the disclosure line under דירוג חנויות | States how many products are comparable and how many excluded. |
| E4 | Cross-check: count green ★ badges on the products screen per store | Must equal that store's "הכי זול" number exactly. |
| E5 | Tap a store row | Jumps to מוצרים filtered to that store, with a clearable chip. |
| E6 | Tap `[ נקה ]` on the chip | Full list returns. |
| E7 | Unmark all products, revisit חנויות | Empty state text shown, no crash, no NaN. |

## F. Layout, targets, themes

| # | Steps | Expected |
|---|-------|----------|
| F1 | At 412 and 360 wide, every screen | No horizontal scrolling anywhere (`scrollWidth <= clientWidth`). |
| F2 | Measure every button/pill/tab/chip | Height ≥ 44px. **Remove `.boot` from `#main` first** — the boot animation's `scaleY(.6)` corrupts measurements. |
| F3 | Switch to WOPR (נתונים → תצוגה) | Red palette, cut corners, corner brackets, grid at the bottom, brand `▮ W.O.P.R // PRICES`. |
| F4 | In WOPR, hover/tap-hold a row and a button | Hover wash must be **red-tinted, never amber**. |
| F5 | CRT: off / עדין / מלא | off = no scanlines at all; מלא = scanlines + vignette; setting survives reload. |
| F6 | Reload in each theme | No flash of the wrong theme on first paint. |
| F7 | Tab through the app with the keyboard | Every control reachable, focus ring visible on each. |

## G. Data safety

| # | Steps | Expected |
|---|-------|----------|
| G1 | נתונים → ייצוא JSON | File downloads; contains `version: 4`, products, categories; contains **no** theme, CRT or calculator keys. |
| G2 | Import that file → החלפה מלאה | Product count unchanged; theme unchanged. |
| G3 | Import a junk file (`{"a":1}`) | Clear Hebrew error; existing data untouched. |
| G4 | Import → מיזוג of the same file twice | No duplicate products or price rows. |
| G5 | Set `localStorage['priceTracker.v2'] = '{broken'` and reload | App boots with seed data + warning banner; corrupt copy kept under `.corrupt`. |

## H. Calculator

| # | Steps | Expected |
|---|-------|----------|
| H1 | מחשבון → `[ טען מהמאגר ]` on offer A → pick product → pick a price | qty/size/unit/price all filled from that entry. |
| H2 | Load a second offer, check the verdict | Names the cheaper offer per unit with a % saving. |
| H3 | Enter mass in A and יחידות in B | "לא ניתן להשוות", no winner declared. |
| H4 | Make both offers equal per unit | Declares a tie. |
| H5 | `[ שמור את X כמחיר במאגר ]` → pick product → type a store | New price row appears on that product, note "מהמחשבון". |
| H6 | Reload the page, return to מחשבון | Inputs still there. |
| H7 | `[ נקה ]` | All offers cleared, verdict resets to the prompt. |

---

## Report format

For each section: PASS / FAIL per numbered case, then a summary listing only the
failures with reproduction steps. End with an overall verdict and the three most
important defects, if any.
