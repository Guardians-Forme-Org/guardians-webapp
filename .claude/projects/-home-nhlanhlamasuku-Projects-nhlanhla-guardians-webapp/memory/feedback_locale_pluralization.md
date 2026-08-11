---
name: feedback-locale-pluralization
description: How to handle singular/plural in locale files — just guardian + guardians keys, switch in code
metadata:
  type: feedback
---

Use simple `"guardian"` and `"guardians"` keys in locale files (no ICU plural syntax). Pick the right key in component code based on the actual count: `count === 1 ? t("guardian") : t("guardians")`.

**Why:** User prefers explicit keys over ICU `{count, plural, ...}` syntax — keep locale files simple and handle the logic programmatically.

**How to apply:** Whenever adding pluralization for guardian counts, add both keys to the relevant locale file and switch between them in the component with a ternary on the count.
