# How to add a new language

## 1. Create the message files

Duplicate the `messages/en/` directory into `messages/<locale>/` and translate every value:

```
messages/
  en/       ← source of truth
  hu/       ← example: Hungarian
  <locale>/ ← your new language
```

There are 11 namespace files to translate:

| File | Covers |
|------|--------|
| `common.json` | Shared UI strings (nav, buttons, roles, etc.) |
| `onboarding.json` | Onboarding flow |
| `get-started.json` | Get-started screen |
| `login.json` | Login screen |
| `signup.json` | Sign-up screen |
| `splash.json` | Splash / loading screen |
| `home.json` | Home feed |
| `discover.json` | Discover screen |
| `circles.json` | Circles feature |
| `challenges.json` | Challenges & evidence wizard |
| `profile.json` | Profile & settings screens |

Keep all keys identical to `en/`; only translate the values.

## 2. Register the locale

Add your locale code to `src/i18n/locales.ts`:

```ts
export const locales = ["en", "af", "zu", "fr", "hu", "<your-locale>"] as const;
```

That's the only registration step — `src/i18n/routing.ts` and `src/i18n/request.ts` both consume this array automatically.

## 3. Add a display name

Add an entry to `LOCALE_LABELS` in `src/components/ui/LanguageSwitcher.tsx`:

```ts
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  af: "Afrikaans",
  zu: "isiZulu",
  fr: "Français",
  hu: "Magyar",
  "<your-locale>": "Display name in that language",
};
```

Use the language's own name (e.g. "Français" not "French") so users can find it regardless of which locale is currently active.

## That's it

The new language will automatically:
- Appear in the in-app language selector on the user's profile
- Be included in `generateStaticParams` so Next.js pre-renders its routes
- Receive the correct `Accept-Language` header on all API requests (handled by `LocaleSync` + `src/lib/locale-store.ts`)
