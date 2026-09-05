# MARKET-VAULT — human test plan v7.0.0

Five minutes. Judgement only — everything a machine can assert lives in the
built-in suite. **Check the version first:** נתונים → אודות must read
`v7.0.0 · סכמה 6`. If it doesn't, you're on a cached page and every result
below is about the wrong build (pull to refresh, or close and reopen the app).

Run the machine suite first. Red means stop:

```
__selftest()        in the browser console, or open with ?dev=1
```

Expect `69 passed, 0 failed` at **412px and at desktop width**, in **VAULT and
HUB**. A skip must say why; a run with an unexplained skip is a failure.

---

## 1 · The shelf moment ⚠️ *new home screen*

Pretend: you're holding a 500g pasta at ₪8, and the sale shelf has a 2-pack of
350g of another brand at ₪10, regular price ₪14 on the tag.

1. Open the app. **Expect:** it opens on **השווה**, two empty offer lines, the
   verdict box says to type size and price for two offers. ☐
2. Offer A: type `500` in גודל and `8` in מחיר. Leave ×1. **Expect:** verdict
   still asks for one more offer. ☐
3. Offer B: tap **×2**, type `350` and `10`.
   **Expect:** the verdict appears *while typing* — a big **הצעה B ★**, under
   it `₪1.43 ל-100 גרם · 11% זול יותר`. Readable from arm's length. ☐
4. Tick **מבצע** on B. **Expect:** a red **מחיר רגיל** line appears under B. ☐
5. Type `14` there. **Expect:** the verdict adds "במבצע · רגיל ₪2.00 ל-100 גרם"
   and, in red, "במחיר רגיל, הצעה A זולה יותר". ☐
6. Tap **מותג?** on B, type `ברילה`. **Expect:** the big verdict now says
   **ברילה ★** instead of "הצעה B". ☐

## 2 · Save the winner ⚠️ *new*

7. Tap **[ שמור את ברילה ]**. **Expect:** a sheet asks **איפה אתה עכשיו?**
   (the app has never been told which shop you're in). ☐
8. Pick a shop. **Expect:** the app-bar chip changes from **📍 איפה אני?** to
   **📍 <shop>**; then a sheet asks **על איזה מוצר?** with **+ מוצר חדש** on top. ☐
9. Tap **+ מוצר חדש**, type `פסטה`, save. **Expect:** an undo toast
   "נשמר: ברילה → פסטה"; the strip under the offers now shows **פסטה** and
   "כאן בפעם הקודמת · מבצע · ₪1.43 … · היום". ☐
10. Tap the shop chip, pick a *different* shop. **Expect:** the save button's
    label changes to name the new shop; nothing else resets. ☐

## 3 · Recall ⚠️ *new*

11. מוצרים → פסטה → **+ הוסף מחיר בחנות** → shop = the *other* shop, size
    `500`, price `7`, tick מבצע, regular `9.5`, save.
12. Back to **השווה**. **Expect:** the strip shows "במקום אחר · <other shop>
    · מבצע · ₪1.40 ל-100 גרם · היום" *and* "כאן בפעם הקודמת …". ☐
13. Tap **[ נקה הכל ]**. **Expect:** both offers empty, verdict back to the
    prompt, product detached, shop chip **unchanged**. ☐

## 4 · Nothing else broke

14. מוצרים: cards still show unit prices where measured; the old **מחשבון**
    tab is gone; `#calc` in the URL lands on השווה. ☐
15. Switch theme to WOPR, then SLIP (נתונים → תצוגה). **Expect:** the home
    screen reads correctly in both — no dark text on dark, no clipped
    ×1×2×3. ☐
16. Delete the test product פסטה (··· → מחק) and clear the shop chip if you
    want a clean slate. ☐

---

## Acceptance for the release

Take the phone to a shop and **measure five real products** through השווה.
If any step needed a second look or a second hand, that step is the next fix.

_Footer: v7.0.0 · סכמה 6 · plan `i-want-a-complete-elegant-dewdrop.md` round 1_
