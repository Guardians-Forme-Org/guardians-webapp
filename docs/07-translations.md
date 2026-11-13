# 7. Translations

The app is in English and Hungarian. English is the source for everything;
other languages are written in Crowdin. There are three kinds of text.

## 1. App text (this repo)

- All UI text is in `messages/<lang>/<namespace>.json`, e.g.
  `messages/en/challenges.json`. The namespaces are listed in
  `src/i18n/locales.ts`; a new file has to be added there.
- In code: `const t = useTranslations("challenges"); t("uploadEvidence")`.
  Never type user-facing text straight into a component: Crowdin can only see
  what's in the message files.
- If a language has no file for a namespace, the English one is used.
- Documents (terms, privacy, admin guide) are message files too. Each language
  must keep **the same structure** as the English (same sections, same number of
  paragraphs and list items), because Crowdin translates line by line and
  rebuilds the file in the English layout.
- Adding a language: copy `messages/en` to `messages/<code>`, add the code to
  `locales` in `src/i18n/locales.ts`, add its name to the language switcher, and
  add it as a target language in Crowdin.

## 2. API messages (guardians-api)

Errors, impact summaries and unit names: `assets/locales/<lang>.yaml`
(go-i18n). The API picks the language from the `Accept-Language` header the app
sends.

## 3. Challenge template text (guardians-api)

Template names, step titles, field labels, hints, options and units are stored
in the database in English. The API translates them on the way out:

- Each text has a fixed key built from where it sits, e.g.
  `CH-004.logWasteAndComposting.anchorPoint.receipt.label`
  (`i18n/templatetext`).
- `assets/templates/en.json` holds every key's English, and
  `assets/templates/<lang>.json` the translations.
- A text is swapped only while the database still has exactly the English from
  `en.json`. A challenge someone renamed keeps its own name.
- **After any template text change** (usually an SQL script), regenerate the
  English list from the updated templates, then upload it to Crowdin:

  ```bash
  go run ./cmd/templatetext -from https://api.stg.theguardians.world/api/v1/templates
  ```

  Without this, the new text has no key and shows in English for everyone.
- When the app saves a step (completing or reopening), the API keeps the step's
  stored text, so translated text never gets written back into the database.

## Crowdin

One project, "Guardians Of The Future", English → Hungarian. The plan allows a
single branch, so the two repos are connected differently:

| | Web app | API |
| --- | --- | --- |
| Source files | `messages/en/*.json` | `assets/templates/en.json`, `assets/locales/en.yaml` |
| In Crowdin | the `development` branch, via the GitHub integration | the top-level `api/` folder |
| English goes up | automatically, synced about hourly from `development` | `scripts/crowdin/api_files.py` (see below) |
| Translations come back | Crowdin opens a pull request from `l10n_development` | build the file in Crowdin, commit it to `develop` |

`scripts/crowdin/api_files.py` uploads the API's English files, and with
`--translations` also its Hungarian. It needs a Crowdin token in `CROWDIN_TOKEN`:

```bash
CROWDIN_TOKEN=… python3 scripts/crowdin/api_files.py ../guardians-api [--translations] [--dry-run]
```

## Rules of thumb

- Change English in the repo; change other languages in Crowdin.
- If you do write Hungarian in the repo (for example, to ship a feature before a
  translator gets to it), also upload it to Crowdin. Otherwise Crowdin's next pull
  request puts English back over it.
- Check Crowdin's pull request before merging, especially for documents, where a
  structure mismatch shows up as deleted paragraphs.
