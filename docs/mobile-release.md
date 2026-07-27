# Mobile Release Notes

This project now has a Capacitor shell for publishing the React/Vite app as a native mobile app.

> **Full iOS release walkthrough** (code → simulator → archive → upload → App Store Connect submission) lives in
> [`.claude/skills/ios-release/SKILL.md`](../.claude/skills/ios-release/SKILL.md).
> In Claude Code it runs automatically when you ask to "release" or "ship" the app; it also reads fine as a plain checklist.

## Current Setup

- Web app source stays in `src/`.
- Web/GitHub Pages build still uses:

```bash
npm run build
```

- Mobile build uses a relative Vite base path:

```bash
npm run build:mobile
```

- Sync the built app into native projects:

```bash
npm run cap:sync
```

If one native platform is not fully configured yet, sync only the platform you are working on:

```bash
npm run cap:sync:android
npm run cap:sync:ios
```

## Android

The Android project is generated in `android/`.

Open it with:

```bash
npm run cap:open:android
```

Android Studio may need to finish Gradle sync locally. The sandbox could not write to `~/.gradle`, so Gradle wrapper setup was not completed during project generation here.

## iOS

The iOS project is generated in `ios/` and its CocoaPods dependencies are
installed (`ios/App/Podfile.lock` is committed; CocoaPods 1.16.2).

Open it with:

```bash
npm run cap:open:ios
```

Sync future web builds into the native project with:

```bash
npm run cap:sync:ios
```

If pods ever need re-resolving (e.g. after adding a Capacitor plugin):

```bash
cd ios/App && pod install
```

## Store Readiness Checklist

- [x] App icon set (1024×1024, no alpha).
- [x] `ITSAppUsesNonExemptEncryption` set in `Info.plist` (export compliance).
- [x] `PrivacyInfo.xcprivacy` created — **must be added to the App target in Xcode** (drag into the App group, check the App target).
- [x] Privacy policy page written (`docs/privacy-policy.*`).
- [ ] Fill in the support email in the privacy policy and **host it at a public URL** (e.g. GitHub Pages) for App Store Connect.
- [ ] Capture store screenshots at Apple's required device sizes (6.9"/6.7" iPhone; the files in `docs/screenshots/` are dev captures, not valid store dimensions).
- [ ] Test Web Speech TTS on a real iOS device / TestFlight before treating pronunciation as reliable.
- [ ] Consider migrating durable user data from `localStorage` to `@capacitor/preferences` (WebView storage can be purged).
- [ ] Verify iOS safe-area spacing and Android back-button behavior.
- [ ] Create signed release builds from Xcode and Android Studio.

## Store Records

- iOS App Store Connect app name: `European Portuguese Flashcards`
- iOS Bundle ID: `com.karinazvereva.flashcards`
