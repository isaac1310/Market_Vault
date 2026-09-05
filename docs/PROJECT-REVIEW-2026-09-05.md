# MARKET-VAULT — project, UX/UI review and delivery roadmap

Reviewed 5 September 2026 · app v6.7.1 · schema 5 · source revision `9bfa9cb`.

## Decision

Prioritize trustworthy shopping comparisons and a faster path to usable data. The product has a strong foundation and a distinctive visual identity, but its initial catalogue cannot demonstrate its central promise: every one of the 41 seeded price records lacks structured package measurements. The stores screen consequently reports zero comparable products out of 21.

Recommended sequence: comparison correctness → first useful comparison → shopping workflow → visual and accessibility polish. The six-week roadmap below is a planning estimate for one developer, with part-time design/review support, rather than a delivery commitment.

## Review scope and evidence

Reviewed the source HTML, build script, README, existing enhancement plan and UI test plan. Built the current app and inspected the local generated preview in the browser. Viewed Products at 360×800, Calculator at 360×800, and Stores at 412×915 in the default VAULT theme; inspected Data through its accessibility tree. Ran the built-in test control: **63/63 passed**. Reproduced the keyboard issue described below through an actual Enter key action.

This is a targeted review, not full release certification. Alternate themes, real-device touch behavior, screen-reader speech, contrast measurements, storage failure simulation, import/export round trips and installed-PWA offline/update behavior remain untested. Source findings are marked separately from browser observations. No application behavior was changed as part of this review.

## Project assessment

| Area | Current assessment | Implication |
|---|---|---|
| Product purpose | Hebrew RTL, device-local supermarket price comparison by normalized units | Clear and useful core purpose; package completeness determines value |
| Architecture | One source HTML file with vanilla JavaScript; generated hosted and standalone outputs | Appropriate for the present scale; retain the simple deployment model |
| Data | Versioned localStorage state, migrations, JSON import/export, pre-import backup and undo | Useful protections already exist; persistence failures still need stronger handling |
| Comparison | Unit normalization, dimension checks, package fallback, store rollup and basket calculations | Individual comparisons are better guarded than aggregate recommendations |
| Presentation | Four themes, self-hosted fonts, RTL layout, unit-price hierarchy, CRT controls | Preserve the identity while improving reading comfort and task hierarchy |
| Verification | Build syntax checks and 63 embedded logic checks | Add focused regressions for real gaps; a passing logic suite does not establish UI correctness |
| Maintainability | Product logic, rendering, event handling and tests share one sizeable file | Keep sections explicit and isolate pure calculations; a framework rewrite is unnecessary for this roadmap |

### Existing features to retain

The old enhancement plan is historical, not a reliable list of unfinished work. The current source already includes category and store management, a package-completion queue, basis switching, unit-price typography, four themes, price history, sparklines, undo, shopping flags, store comparisons, calculator load/save, backup reminders, and a Claude-assisted photo-to-paste workflow.

Do not propose these again as new features. Improve their discoverability and correctness. The old plan's no-build assumption, the test plan's `price-tracker-v3.html` URL and schema-4 export expectation, and the README's three-theme list have drifted from the implementation.

## Prioritized project findings

### R1 — P1: basket order compares different normalized subsets

**Evidence: source review**, `price-tracker.html`, `basketFor()` and `basketRanking()` around lines 1393–1428.

Full coverage is determined by `have`, while sorting compares `fairTotal` whenever both stores have any normalized items. Two stores can each carry every requested product while their normalized totals cover different subsets.

Example to turn into a regression: request products X and Y. Store A has measured X at ₪10 and unmeasured Y at ₪100; Store B has measured X at ₪12 and measured Y at ₪20. Both stores have full catalogue coverage, but A's normalized subtotal of ₪10 sorts ahead of B's ₪32 despite omitting Y. A warning badge does not make those totals comparable.

**Change:** only rank full normalized coverage as a complete comparable basket. Group partial coverage separately, list excluded products, and compare an explicitly identical subset if a partial comparison is offered. Distinguish recorded coverage from current availability.

**Acceptance:** the example above never presents A as the cheapest complete normalized basket; ties, zero normalized coverage and different missing-product sets have explicit outcomes.

### R2 — P1: recommended split uses raw package prices

**Evidence: source review**, `bestSplit()` around lines 1432–1459 and its recommendation heading in `viewStores()`.

The split calculation minimizes package prices without a requested quantity. A smaller package can win even when buying enough of it costs more. The UI labels the amount “at checkout,” but recommends the pair without establishing whether it satisfies the user's shopping needs or saves anything compared with one store.

**Change:** until quantities exist, describe this as the lowest recorded one-package-per-product combination and avoid an unconditional recommendation. With requested quantities, round up to whole packs, show allocations and overbuy, and compare the result against the best eligible single store. A user-entered extra-trip cost can be added later.

**Acceptance:** a 500g pack at ₪8 must not beat a 1kg pack at ₪12 for a 1kg need; equal-cost splits do not imply savings.

### R3 — P1: failed saves can look successful

**Evidence: source review**, `lsSet()` / `save()` around lines 831–834, calculator save around lines 1792–1816, and storage banners in Products/Data.

`lsSet()` records failure, but `save()` returns no success result and callers can continue to display saved messages. Failure warnings are not part of every screen. A price accepted in memory may disappear after reload.

**Change:** return and handle persistence success, show a persistent app-wide unsaved state, and offer export of the in-memory state. Keep recovery available when storage is unavailable.

**Acceptance:** simulate a rejected storage write; no success message appears, switching screens retains the warning, and the current in-memory data can be exported.

## QA & UX review

Priority: P1 = significant task or trust issue; P2 = smaller usability/craft improvement. No P0 issue was established in this review.

### Functionality

- [ ] **[P1] Correct basket eligibility and split messaging** using R1/R2 so the shopping decision reflects comparable contents. Source finding.
- [ ] **[P1] Show unsaved changes across all screens** using R3 so a storage failure cannot masquerade as success. Source finding.
- [ ] **[P1] Replace the zero-comparison store leaderboard with an actionable empty state** when no products are comparable. The reviewed initial screen showed twelve stores with “0 cheapest”; show “אין מספיק נתונים להשוואה” and a completion action instead. Browser observation.

### Usability

- [ ] **[P1] Lead first use with one complete comparison.** The reviewed initial state has 21 products and 41 incomplete records. Offer “השלם מוצר ראשון” and explain quantity × size with an example. Never infer missing package measurements silently. Browser observation.
- [ ] **[P1] Expose shopping-list selection on product cards.** It is currently inside the product menu, while the empty Stores screen tells users to go find it there. Add a labeled toggle and selected count. Browser/source observation.
- [ ] **[P2] Move data health and backup above appearance and catalogue maintenance.** Data currently starts with themes, six categories and twelve stores before its completion action. Put urgent, actionable data tasks first; collapse maintenance sections. Browser observation.
- [ ] **[P2] Separate no search results from an empty catalogue.** `productList()` currently tells users to add a product for every empty result. Offer clear-search and clear-filter actions when filters caused the empty state. Source finding.
- [ ] **[P2] Clarify the photo workflow at entry.** “Add from photo · via Claude” is prominent above the catalogue; make clear that it involves an external assistant and reviewed pasted results. Keep ordinary price entry equally easy to find. Browser/source observation; external workflow not executed.
- [ ] **[P2] Define calculator quantity and size beside the fields.** Use an example such as “4 אריזות × 98 גרם” and make the verdict reachable after entering the second offer on a narrow screen. The stacked forms are long on mobile. Browser observation; completion timing not measured.

### Visual consistency

- [ ] **[P2] Strengthen metadata legibility in the default theme.** At 360px, dates, package notes and labels compete with CRT texture and several text fragments per row. Reduce decorative interference and simplify secondary lines while preserving prominent prices. Visual observation; numeric contrast conformance not measured.
- [ ] **[P2] Shorten the first-screen control stack.** The backup banner, search, two rows of categories and photo action place the first product well below the header. Keep recovery visible when needed, but make optional actions more compact. Visual observation.
- [ ] **[P2] Give each numeric store metric a clear meaning.** A large “0” above “cheapest” is unhelpful when the evidence count is zero. When data exists, show comparable-product coverage alongside wins. Browser observation.

### Accessibility

- [ ] **[P1] Preserve native keyboard behavior for buttons inside price rows.** Reproduction: focus the first “+ השלם כמות ומשקל” button and press Enter. Expected: package-completion form. Actual: row action sheet with Update/Edit/Delete. The global key handler near line 3115 finds the ancestor `[role="button"]`, prevents the child's default action, and clicks the row. Ignore nested interactive targets or use a separate explicit row-action button. Browser-confirmed defect.
- [ ] **[P2] Give repeated actions product/category/store context in accessible names.** Names such as “product actions,” “rename” and “delete” repeat without their subject. Include the subject so controls remain understandable outside surrounding visual text. Accessibility-tree observation.
- [ ] **[P2] Verify reading and focus behavior across all themes before release.** Check Hebrew/Latin/number ordering, dialog focus return, 200% zoom, reduced motion and measured text contrast. These are required follow-up checks, not claimed failures.

### Edge cases

- [ ] **[P1] Treat stale prices and promotional conditions as comparison inputs.** Dates and a sale flag already exist, but ranking does not establish whether an old promotion still applies. Add explicit freshness/offer eligibility before stronger “recommended” claims. Source finding.
- [ ] **[P2] Distinguish unknown from zero.** Missing package information, no comparable stores and actual zero savings need different messages so users understand what action can produce an answer. Browser/source observation.

**Verdict: Fail for release sign-off on the affected comparison and keyboard flows.** The app remains useful for recording prices and individual measured comparisons, but its decision-oriented flows need the P1 issues resolved.

## Feature proposals

Effort is an initial developer-day range, including focused verification; discovery may change it. Work overlaps the roadmap, so do not add these estimates to the phase estimates again.

| Proposal | User value and MVP | Acceptance | Priority / effort / dependency |
|---|---|---|---|
| First-comparison guide | Extend the existing completion queue with product selection, a quantity example and progress toward two comparable offers | A new user can create two measured offers and explain which is cheaper; incomplete data remains explicit | P1 · 2–3 days · none |
| Shopping mode | Visible card toggles, a selected-items list and quantities; preserve selections after reload | Add/remove items without opening menus; amount and unit survive export/import migration | P1 · 4–6 days · quantity/schema design |
| Explainable basket | Full versus partial coverage, item allocations, whole-pack cost and equal-quantity reference shown separately | Totals reconcile with line items; partial baskets cannot win as complete baskets | P1 · 4–6 days · R1 and shopping quantities |
| Price freshness controls | Extend existing age labels with a user-chosen stale threshold and a “refresh prices” queue | Excluded stale offers are named; changing the threshold updates eligibility predictably | P1 · 2–3 days · comparison eligibility rules |
| Faster repeat-price update | Promote the existing update action and prefill store/package details; require only a new price when unchanged | Updating adds a dated history snapshot and keeps the package information intact | P2 · 1–2 days · keyboard fix |
| Conditional offers | Structured minimum packs and optional expiry/member-only condition | An unmet promotion cannot silently win; details survive migration/export | P2 · 3–5 days · eligibility and quantity model; after core roadmap |
| Safe assisted import | Extend current paste import with a before-save summary of product, store, date, units and missing fields | User reviews proposed values; ambiguous data is flagged and never invented | P2 · 2–4 days · existing paste parser; stretch scope |

Defer cloud sync, live supermarket feeds, built-in OCR and accounts until core use is validated. They require separate choices about external services, privacy, conflict handling and ongoing maintenance; they are not prerequisites for this local-first product.

## Suggested delivery timeline

Assumption: kickoff Monday **7 September 2026**, one developer, roughly 24 implementation days plus 6 days of validation/contingency across six weeks. Shift dates together if the start changes. A feature progresses only after its acceptance gate passes.

| Phase | Suggested dates | Scope | Exit gate |
|---|---|---|---|
| Week 1 — trustworthy core | Sep 7–11 | R1 basket eligibility, qualified split labels, R3 save-failure handling, nested-button keyboard fix, targeted regressions | Comparable totals contain identical products; failed saves are visible; Enter and Space activate the intended child button |
| Week 2 — first useful comparison | Sep 14–18 | First-comparison guide, Data screen order, actionable empty/search states, visible shopping toggles and fast price update | A first-time user completes two offers and selects shopping items without coaching |
| Week 3 — shopping quantities | Sep 21–25 | Requested amounts, compatible units, state migration, whole-pack rounding and cost breakdown | Existing data migrates unchanged; 500g/1kg regression and export/import checks pass |
| Week 4 — explainable recommendations | Sep 28–Oct 2 | Itemized allocations, single-store versus split comparison, freshness threshold and refresh queue | Recommendations satisfy quantities and eligibility; omissions and assumptions appear next to totals |
| Week 5 — UI and accessibility | Oct 5–9 | Metadata hierarchy, calculator guidance, contextual accessible names, all-theme mobile/keyboard/zoom checks | P1 UI defects resolved; no inaccessible core action, clipped critical content or unexplained comparison |
| Week 6 — pilot and release readiness | Oct 12–16 | Small observed-user pilot, actual-device offline/install/update checks, restore tests, documentation refresh and fixes | No open P1 in scoped flows; a real-device backup/restore succeeds; pilot findings have owners |

Suggested checkpoints: end of Week 1 for correctness; end of Week 2 for first-use usability; end of Week 4 for shopping feature completeness; end of Week 6 for release decision. Conditional promotions and assisted-import expansion move into a later cycle unless the core work finishes early.

## Validation and success measures

Use an opt-in observed pilot and local fixtures; no telemetry service is required. These are proposed targets, not measured outcomes:

- Four of five pilot users complete their first two-offer comparison within three minutes without intervention.
- Four of five find shopping-list selection without being told to open a menu.
- Every displayed complete-basket total reconciles with the same selected items and quantities in regression fixtures.
- Every core action is reachable by keyboard, and child controls open the intended dialog.
- Storage rejection never displays a saved confirmation; a recovery export preserves in-memory entries.

Add manual cases for the reproduced keyboard defect, normalized-subset coverage, whole-pack rounding, stale promotions, search-no-results recovery and failed writes. Refresh the existing test plan's preview URL and schema expectation. Run its remaining dialog, import, undo, theme and layout cases before release; the present review did not execute the entire plan.

## Immediate next implementation slice

Implement Week 1 as a small correctness change with regressions for R1, R3 and the confirmed keyboard defect, plus conservative split wording for R2. Then validate the revised first-use flow before spending time on additional features or themes.
