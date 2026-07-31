# MARKET-VAULT · מעקב מחירים

A single-file, offline-first Hebrew (RTL) price tracker. Compares supermarket
prices **per unit** — ₪ per 100g / kg / L / unit — so a bigger pack never wins
just by looking cheaper at the till.

No build step, no dependencies, no framework, no network calls at runtime.
Data lives in the browser's `localStorage` on one device and is never uploaded.

## Files

| Path | What it is |
|---|---|
| `price-tracker.html` | **The app.** The only file you edit. |
| `deploy/` | What gets deployed. `index.html` is a copy of the app, plus the PWA files and self-hosted fonts. |
| `vault-mart.html` | Standalone build — icon and manifest inlined, works from `file://` with nothing beside it. |
| `preview-ultra.html` | Renders the app in a Galaxy Ultra-sized frame for desktop review. |
| `ENHANCEMENT-PLAN.md` | The design review and phased spec this was built from. |
| `UI-TEST-PLAN.md` | 40-case manual/agent UI test plan. |

`deploy/index.html` and `vault-mart.html` are **generated from** `price-tracker.html`.
Never edit them directly — edit the app and rebuild (see below).

## Deploying

```bash
npx vercel --prod --cwd ./deploy
```

Or drag the `deploy` folder onto Vercel and promote the deployment.

## Rebuilding the generated files

After editing `price-tracker.html`, copy it to `deploy/index.html`, and rebuild
`vault-mart.html` with the icon and manifest inlined as data URIs.

## Tests

The app carries its own logic suite — unit-price maths, migrations, import
validation, basket comparison, price age. It runs once per version on boot and
warns only on failure.

- In the browser console: `__selftest()`
- Or open the app with `?dev=1` to see the results panel in the נתונים screen.

`UI-TEST-PLAN.md` covers what the logic suite structurally cannot: real clicks,
dialogs, focus, layout and touch targets.

## Versioning

`APP_VERSION` (shown in נתונים → אודות) and `SCHEMA_VERSION` are different numbers.

- **major** — the data schema changed (there is a migration)
- **minor** — new features
- **patch** — fixes

The אודות badge shows both, e.g. `v6.3.0 · סכמה 5`.

## Data

`localStorage` keys, all device-local:

| Key | Contents |
|---|---|
| `priceTracker.v2` | Products, prices, categories, shops (schema 5) |
| `priceTracker.theme` | `vault` \| `wopr` \| `slip` |
| `priceTracker.crt` | `off` \| `subtle` \| `full` |
| `priceTracker.calc` | Calculator inputs |
| `priceTracker.v2.backup` | Auto-backup taken before any import |

Theme, CRT and calculator state are deliberately **outside** the app state, so
export / import / migration never touch them.

Export and import JSON from the נתונים screen. That export is the only backup —
the data exists on one device.
