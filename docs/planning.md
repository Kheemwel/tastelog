# Tastelog: Planning and Design Document

Version 1.0.0 · Android + Web · Expo SDK 57 · Written October 2026

This document records what Tastelog is, the decisions behind it, what was actually built, and what is still unverified. It replaces the earlier pre-build plan and describes the app **as built**. Where the build differs from the original plan, section 12 says so.

## 1. What Tastelog is

Tastelog is an offline-first food journal. The user logs what they ate, rates it from 0 to 10, picks a mood for how the food made them feel, and optionally adds a comment, a place, and tags. The same food can be logged many times, for example at different places, so the app can answer "where did I enjoy this most?". All data lives on the device. A JSON export and import is the only backup and transfer mechanism. There are no accounts, no network calls, and no analytics.

It is a hobby project, built once and then left alone. There are no planned updates, which is why the logic is covered by tests and why the data format is versioned.

## 2. Scope (as shipped)

### In version 1

- Add, edit, and delete entries
- Journal list with search, plus filters for food, place, tag, mood, rating range, and date range
- Autocomplete for food, place, and tags, based on what the user already entered
- Rename tool: fix a food, place, or tag spelling across all entries at once
- Five charts (section 7) and an Analytics screen
- JSON export: share sheet and "save to device" on Android, download on web
- JSON import with merge or replace
- "Delete all data" with a typed confirmation (added during the build)
- Dark mode that follows the system setting, with a sky-blue theme
- A development-only panel that generates sample data for performance testing
- Targets: Android and web

### Not in version 1

Photos, reminders or notifications, CSV export, iOS, multiple languages, accounts or cloud sync, a manual theme toggle, half-star or decimal ratings, custom moods, per-food mood charts, and a warning when leaving the entry form with unsaved changes.

## 3. Data model

The app stores one kind of record, the entry. Foods, places, and tags are not stored on their own. They are derived from entries.

```
Entry
  id         string (UUID, unique)
  foodName   string, required (trimmed, not empty)
  rating     whole number 0-10, required, nothing selected by default in the form
  mood       one of the 11 mood keys, default "unsure"
  comment    string, omitted when empty
  place      string, omitted when empty
  date       "YYYY-MM-DD" local date, defaults to today, editable
  tags       list of strings, always present (may be empty), no duplicates by match key
  createdAt  ISO timestamp (UTC), used only to order entries within a day
```

### Match keys

Food, place, and tag text is stored exactly as typed. For matching, grouping, filters, and charts, the app computes a hidden key: trim, collapse repeated spaces, lowercase. So "Mcdo", "mcdo ", and "MCDO" are the same place. The key is never shown. A derived name is displayed using the spelling from the most recently created entry that has that key. The app does not merge different words ("Mcdo" and "McDonald's"); the rename tool exists for that.

### Dates

`date` is a plain local `YYYY-MM-DD` string built from local year, month, and day. Never use `toISOString().slice(0, 10)`: it returns the UTC date, which is the wrong day for part of the day in time zones like UTC+8. Date filters are simple string comparisons.

### Moods (11, fixed)

The mood **key** is stored, never the emoji, so an emoji can change without breaking old exports.

- happy 😄
- energized ⚡
- comforted 😌
- neutral 😐
- sluggish 😴
- stressed 😣
- sad 😢
- disappointed 😞
- disgusted 🤮
- upset_stomach 🤢
- unsure 🤔 (the default)

Moods have no numeric score. They are only counted. The list is final: removing or renaming a key breaks old backups, because import rejects unknown moods.

### Export file format

```
{ "app": "tastelog", "version": 1, "exportedAt": "<ISO timestamp>", "entries": [ ... ] }
```

## 4. Import, export, and reset rules

- **Validate first, write second.** Import parses the file, checks `app` and `version`, and validates every entry (string id, non-empty food, whole-number rating 0 to 10, known mood, real date, valid timestamp). One invalid entry rejects the whole file with a message naming it (for example "Entry 2: Rating must be a whole number from 0 to 10"). Duplicate ids inside a file are also rejected. A leading byte-order mark is tolerated. Nothing is written unless everything passes.
- **Merge:** adds imported entries whose id is not already present and skips the rest. If ids clash, the local copy is kept. A summary is shown ("32 added, 88 skipped"). No "Imported" tag is added.
- **Replace:** a two-step confirmation that states how many current entries will be deleted, then replaces everything with the file's entries.
- **Last exported:** stored and shown in Settings, with a gentle nudge when there are entries and no backup in the last 30 days. For the Android share sheet this is best effort, because the app cannot tell whether the user actually sent the file or closed the sheet.
- **Android export:** "Share backup" opens the share sheet. "Save backup to device" opens the system folder picker and writes a file named by local date, for example `tastelog-2026-10-14.json` (Android adds the extension).
- **Web export:** a normal file download.
- **Delete all data:** needs typing DELETE. It removes every key the app wrote (all start with `tastelog:`), including the last-exported time and any backups of unreadable data, and resets the Journal filters. It never touches keys from other apps.
- **Unreadable stored data:** if the stored data cannot be parsed, the raw text is kept under another key and the app starts empty, instead of overwriting it. There is no screen for recovering it; it is a safety net for debugging.

## 5. Architecture

Three layers, where each only knows about the one below it.

```
Screens (React Native Paper UI)
   uses
Logic (pure TypeScript, no React Native imports)
   search, filters, stats, rename, import merge, match keys, validation, sample data
   uses
Storage interface (the only code that touches storage)
   implemented by AsyncStorage
```

```
EntryStore
  getAll, upsert, remove, replaceAll
  getLastExportedAt, setLastExportedAt
  clearAll
```

- Every method is async, so a future storage swap does not ripple through the app.
- The store takes its storage engine as an argument (`createEntryStore(AsyncStorage)`), so tests use an in-memory fake.
- Operations run one at a time in a queue, so two quick saves cannot overwrite each other.
- All entries are loaded into memory at startup. Search, filters, and chart numbers are computed in plain TypeScript. This behaves the same on Android and web.

### Folder layout

```
src/
  app/            routes only: _layout.tsx, entry.tsx, filters.tsx, rename.tsx,
                  (tabs)/_layout.tsx, index.tsx, analytics.tsx, settings.tsx
  components/     BarList, DateField, DevTools, EntryCard, NamePicker, SuggestionChips
  lib/            pure logic and tests: moods, types, keys, validation, importExport,
                  names, query, rename, stats, format, sampleData, testHelpers, __tests__/
  state/          EntriesProvider, FiltersProvider
  storage/        entryStore, index, newId, files (file picker, share sheet, download), __tests__/
  theme/          colors.ts (generated), index.ts
```

Platform-specific files (`.web.tsx`) work in `components/` but not for route files in `app/`. None were needed in the end.

## 6. Screens and navigation

Bottom tabs: **Journal**, **Analytics**, **Settings**. Modal screens on top: the entry form (`/entry`, with an optional `id` for editing), Filters, and Rename. The Stack header shows the route name by default, so titles are set explicitly.

- **Journal:** search bar, a Filters button showing the number of active filters, a Clear action, an "N of M" count, entry cards (mood emoji, food, place and date, comment preview, tags, rating), empty states, and an add button. The list is a FlatList.
- **Entry form:** food with autocomplete, rating 0 to 10 as chips (nothing selected at first), mood chips, comment, place and tags with autocomplete (including the most-used names before typing), date via the date picker, Save, and Delete with confirmation when editing. A tag typed but not yet added is included on Save. A new entry's id is created once, so a double tap cannot create two entries.
- **Filters:** food, place, and tag are picked from existing names (type to narrow, then tap), mood is multi-select, rating has a lowest and a highest, and the date range has From and To with clear buttons. Filters combine with AND and apply only when Apply is pressed.
- **Analytics:** all five charts. Journal search and filters do not apply.
- **Settings:** Backup (share, save to device, last exported), Restore (import), Tidy up (rename), Delete data, and, in development builds only, Developer tools.
- **Rename:** choose Food, Place, or Tag, pick the name, type the new name. It shows how many entries will change and warns when the new name merges with an existing one.

## 7. Charts

1. **Average rating per month.** A line chart (the only one using `react-native-gifted-charts`), y-axis fixed at 0 to 10, needing at least two months. Entry counts per month are listed under the chart (a change from "show on tap").
2. **Mood distribution.** Horizontal bars sorted by count. Unused moods are left out.
3. **Most eaten foods.** Horizontal bars, top 10.
4. **Average rating.** A By place / By food toggle. Only items with at least 2 entries are ranked; if none qualify, everything is shown with a note. Entries without a place are ignored in place mode.
5. **Same food, different places.** Starts on the most-eaten food, with a picker. Entries without a place appear as "(no place)".

Charts 2 to 5 are drawn with plain Views, not a chart library. Long names and emoji labels wrap cleanly, they look the same on Android and web, and they follow the theme. All charts use theme colors, so they follow dark mode.

## 8. Tech stack

Install with `npx expo install` so versions match the SDK, and do not change the SDK casually.

- Expo SDK 57, Expo Router (typed routes on), React Compiler experiment on
- React Native Paper (Material 3) and `@expo/vector-icons` (Paper needs an icon package; the SDK 57 template does not include one)
- `react-native-paper-dates` for the date picker (needs `registerTranslation('en', en)` once)
- `@react-native-async-storage/async-storage` (localStorage on web)
- `react-native-gifted-charts` with `react-native-svg` and `expo-linear-gradient`
- `expo-document-picker`, `expo-file-system` (File and Directory API), `expo-sharing`
- `expo-crypto` for UUIDs, `expo-status-bar` for the status bar
- Tests: `jest` with `jest-expo`. With TypeScript 6, `"types": ["jest"]` must be added to `tsconfig.json` or test globals are not found; keep the template's `paths` and `include` entries too.

**Why AsyncStorage and not SQLite:** `expo-sqlite` on web was still labelled alpha in the docs checked at planning time and needs wasm and special server headers. The design needs no SQL because everything is computed in memory. AsyncStorage behaves the same on both platforms, and the web build can be hosted anywhere.

**Why Paper:** it has light and dark Material 3 themes and the components the app needs (inputs, chips, dialogs, segmented buttons). Other options (NativeWind, React Native Reusables, `@expo/ui`) add more setup or have weaker web support.

### Theme

The palette is generated from the seed color #87CEEB with Google's `@material/material-color-utilities` (version 0.3.0 works in plain Node; 0.4.0 failed to load when tried) and stored as static values in `src/theme/colors.ts`. Light mode uses a deeper blue primary (`#006781`) with light sky-blue containers (`#baeaff`). Dark mode uses a bright sky blue primary (`#5fd4fe`). A literal #87CEEB primary was rejected because text and icons drawn in the primary color would be unreadable on white (contrast about 1.7 to 1). Every Paper color, including the elevation tints, is overridden so nothing stays purple.

## 9. Testing

Run `npm test`. The unit tests cover everything with logic: match keys and dates, validation, import and export (round trip, rejections, merge, idempotent re-import), the store (updates, concurrency, persistence, unreadable data, clearAll), autocomplete, search and filters, rename, chart statistics, formatting, and the sample-data generator. The date tests are most meaningful in a UTC+8 time zone (set `TZ=Asia/Manila` on macOS and Linux). The screens themselves have no automated tests; they were checked by hand on the phone and in the browser.

## 10. Build and release

- **Android:** built in the cloud with EAS Build as a release APK (see `eas.json` for the profiles). EAS holds the signing key. Keep using the same project so future builds are signed with the same key; a build with a different key cannot update the installed app in place, and uninstalling deletes the data.
- **Development build:** for checking native behavior without a slow release build each time, build a development client once (`developmentClient: true`) and run `npx expo start --dev-client`. JavaScript changes then reload instantly.
- **Web:** `npx expo export --platform web` creates a static site in `dist/` (one HTML file per route). It can be hosted on any static host. The documented setup is Netlify from GitHub with a `netlify.toml` (build command `npx expo export --platform web`, publish directory `dist`, `NODE_VERSION = "22"`). If a direct link to a screen gives a 404, set `web.output` to `single` and add a catch-all redirect to `/index.html`.
- **App config:** name Tastelog, package `com.kheemwel.tastelog` (permanent once published), sky-blue adaptive icon background, a themed monochrome icon (Android 13 and newer), a splash with a sky-blue background, and a favicon. The iOS icon entry was removed.

## 11. Lessons from testing

- **Expo Go is not the real app.** It differed from the release build in several ways: reading imported files failed in Expo Go (fixed with `copyToCacheDirectory: false`), the status bar was opaque black there but transparent in the real app, and the icon and splash are Expo Go's own. Judge native behavior on an installed build.
- **Status bar:** `expo-status-bar` only sets the icon color, never the background. `style="auto"` is correct once the bar is transparent. Importing `StatusBar` from `react-native` by mistake (an easy editor auto-import) gives a confusing `style` prop error.
- **Typed routes** are generated while `npx expo start` is running; a stale file makes new routes look invalid in the editor.
- **Dates:** the UTC date bug was found early and fixed with a local-date helper.
- **Icons:** Paper's icons need `@expo/vector-icons`, otherwise they show as boxes and an error.
- **The Android share sheet** does not list file managers. That is normal, which is why "Save backup to device" exists next to "Share".

## 12. Changes from the original plan

- **UI:** Paper for the UI, `react-native-paper-dates` for dates, a generated sky-blue theme.
- **Storage:** AsyncStorage instead of SQLite, behind a store interface.
- **Data model:** `tags` is always a list. The store gained `getLastExportedAt`, `setLastExportedAt`, and `clearAll`.
- **Scope additions:** Delete all data, the development-only sample-data panel, and the rename tool's merge behavior.
- **Charts:** charts 2 to 5 are plain bars, and chart 1 shows counts under it instead of on tap.
- **Moods:** 11 final moods (satisfied and calm were replaced by comforted, disappointed, and disgusted were added).
- **Layout:** the SDK 57 template keeps code in `src/`.
- **Rating:** 0 to 10 instead of stars.

## 13. Known limitations and open items

- The "last exported" date for the Android share sheet cannot confirm the file was actually sent.
- Saving two backups to the same folder on the same day uses the same file name. How Android handles that collision was not tested.
- Browser data belongs to one exact site address. A different domain, a renamed site, or a preview deploy starts empty, and the browser may clear data. Export regularly.
- The emoji 😞 and 🤮 were added after the first emoji check and were not individually confirmed on older phones.
- The Journal list has not been tuned for very large journals. How it feels with thousands of entries was not reported.
- There is no warning when leaving the entry form with unsaved changes.
- The themed monochrome icon only appears on Android 13 and newer.
- No iOS build.

## 14. Release checklist

Reported by the owner: a release APK built with EAS installs, the features work, and the status bar is correct on the second build.

Not individually confirmed yet:

- [ ] Wrong-day dates around midnight: log an entry at about 12:30 AM and check the date
- [ ] A deliberately broken backup file is rejected and changes nothing
- [ ] Large journal: 3000 sample entries generated in a development build, exported, imported into the release app, and checked for scrolling, search, and charts
- [ ] The Developer tools panel is absent from Settings in the release build
- [ ] Web site deployed, entries save and survive a refresh, direct links to screens load, export and import work
- [ ] Release tagged in Git (for example `v1.0.0`)

## 15. If it is ever touched again

- Never rename or remove a mood key, and bump the export `version` (and keep reading version 1) if the data format changes.
- Keep the Android signing key with the same EAS project.
- Pin the SDK. Upgrade deliberately, then re-run the tests and re-check the release build.
- Keep logic in `src/lib` free of React Native imports, so it stays testable.
