# Tastelog

An offline-first food journal for Android and the web. Log what you ate, rate it from 0 to 10, pick a mood for how the food made you feel, and add a place, tags, and a comment. Search and filter your journal, and see charts of your ratings, moods, favorite foods, and the places you liked best.

Everything stays on your device. There are no accounts, no servers, and no tracking. Backups are JSON files you export and import yourself.

## Features

- **Journal:** add, edit, and delete entries (food, rating 0 to 10, mood, comment, place, tags, date)
- **Same food, many entries:** log a food again at another place and compare
- **Autocomplete:** food, place, and tag suggestions from what you already entered. "Mcdo" and "mcdo" count as the same place
- **Search and filters:** by food, place, tag, mood, rating range, and date range
- **Analytics:** average rating per month, mood distribution, most eaten foods, average rating by place or food, and one food compared across places
- **Rename tool:** fix a spelling everywhere at once, or merge two names into one
- **Backup:** export a JSON file (share sheet or save to a folder on Android, download on web) and import it back, merging or replacing
- **Delete all data:** a typed confirmation, for starting fresh
- **Dark mode:** follows your phone's setting, with a sky-blue theme

## Tech stack

Expo SDK 57 with Expo Router, React Native, TypeScript, React Native Paper (Material 3), `react-native-paper-dates`, AsyncStorage, `react-native-gifted-charts`, and Jest with `jest-expo` for tests.

## Getting started

You need Node.js 20.19.4 or newer, 22.13 or newer, or 24.3 or newer (a React Native 0.86 requirement), and npm.

```bash
npm install
npx expo start
```

Press `w` to open the web version, or scan the QR code with Expo Go.

Expo Go behaves differently from an installed build: the status bar, the icon and splash, and file access for imports can all differ. To check native behavior without waiting for a release build each time, make a development build once and use it instead:

```bash
npx expo install expo-dev-client
eas build --platform android --profile development
npx expo start --dev-client
```

Keep `npx expo start` running while you add routes, so the typed route definitions stay up to date.

### Tests and lint

```bash
npm test
npm run lint
```

The tests cover all the logic: matching, validation, import and export, the storage layer, search, filters, rename, and chart statistics. On macOS or Linux, `TZ=Asia/Manila npm test` runs them in a UTC+8 time zone, which is the best check for the date handling.

### Developer tools

In development builds, Settings shows a Developer tools panel that adds or removes thousands of sample entries for performance testing. Sample entries carry the tag `sample-data`. The panel is not included in release builds.

## Project structure

```
src/
  app/          routes only (tabs: Journal, Analytics, Settings; modals: entry, filters, rename)
  components/   shared UI pieces
  lib/          pure TypeScript logic with unit tests (no React Native imports)
  state/        shared state for entries and filters
  storage/      the storage layer, file import/export, and ids
  theme/        the generated sky-blue Material 3 colors
```

The storage layer sits behind a small interface (`EntryStore`), so the storage engine can be swapped in one place (`src/storage/index.ts`).

## Your data and backups

Entries are stored in AsyncStorage: the app's local storage on Android and the browser's local storage on web. Nothing leaves the device unless you export it.

- **Android:** clearing the app's data or uninstalling it deletes the journal.
- **Web:** the data belongs to one exact site address in one browser. A different address (including a renamed site or a preview deployment) has its own empty journal, and the browser can clear it.
- **Export often.** Settings shows when you last exported a backup.

A backup file looks like this:

```json
{
  "app": "tastelog",
  "version": 1,
  "exportedAt": "2026-10-14T03:00:00.000Z",
  "entries": [
    {
      "id": "…",
      "foodName": "Ramen",
      "rating": 9,
      "mood": "happy",
      "comment": "Rich broth",
      "place": "Ichiran",
      "date": "2026-10-14",
      "tags": ["noodles"],
      "createdAt": "2026-10-14T03:00:00.000Z"
    }
  ]
}
```

Import checks the whole file first. If any entry is invalid, the file is rejected with a message naming it, and nothing is changed. Merge adds entries whose id is new and keeps your existing ones. Replace swaps the whole journal for the file, after a confirmation.

## Building

### Android

Builds run in the cloud with EAS Build. The profiles are in `eas.json`; use one configured to produce an installable APK (`android.buildType: "apk"`).

```bash
eas build --platform android --profile <your-profile>
```

The app id is `com.kheemwel.tastelog`. EAS stores the signing key, so keep building from the same EAS project. A build signed with a different key cannot update an installed copy, and uninstalling deletes the data, so export a backup first. The themed (monochrome) launcher icon only appears on Android 13 and newer.

### Web

```bash
npx expo export --platform web
```

The app sets `web.output` to `"single"` in `app.json`, so the export is a single-page app: one `index.html` plus the JavaScript, written to `dist/`. Any static host can serve it, as long as every address falls back to `index.html`. (The default `static` output pre-draws each screen as HTML at build time, always in the light theme, and the browser keeps those pre-drawn colors on first load, so dark mode looked wrong. Single-page output avoids that.)

For Netlify, add a `netlify.toml`:

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

New projects on Netlify's Free plan show a "Powered by Netlify" badge by default. It can be turned off under Project configuration, General, Powered by Netlify badge.

## Theme

The colors in `src/theme/colors.ts` were generated from the seed color `#87CEEB` with Google's `@material/material-color-utilities`. Use version 0.3.0 if you regenerate them: 0.4.0 failed to load in plain Node when tried. The generated values replace every Paper color, including the elevation tints.

## Design notes

The full design, the decisions behind it, the changes from the first plan, and the known limitations are in `tastelog-planning.md`. A few rules worth keeping:

- Mood keys are stored in entries and backups. Never rename or remove one.
- Dates are local `YYYY-MM-DD` strings. Never build them with `toISOString()`.
- Change the export `version` if the backup format ever changes.

## Known limitations

- No iOS build.
- The "last exported" date for the Android share sheet cannot confirm the file was actually sent.
- There is no warning when leaving the entry form with unsaved changes.
- It is a hobby project with no planned updates.