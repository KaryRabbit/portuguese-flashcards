---
name: ios-release
description: Ship a new iOS version of the flashcards app end to end — bump version/build, build + sync the Capacitor bundle, validate on the simulator, archive with xcodebuild, upload via Xcode Organizer, and finish the App Store Connect submission. Trigger when the user wants to release, deploy, ship, or submit the app (or a new version) to the App Store or TestFlight.
---

# iOS Release: code → App Store Connect

Ships the current code as a new iOS App Store version. Store records:

- App Store Connect app ID: `6782990887`
- In-flight version page: https://appstoreconnect.apple.com/apps/6782990887/distribution/ios/version/inflight
- App name: `European Portuguese Flashcards` · Bundle ID: `com.karinazvereva.flashcards`
- Version numbers live in `ios/App/App.xcodeproj/project.pbxproj`: `MARKETING_VERSION` (user-facing, must match the version created in App Store Connect) and `CURRENT_PROJECT_VERSION` (build number, must be unique per upload — bump it every time, appears twice in the file).

## 1. Preconditions

- Working tree committed (never archive uncommitted code without flagging it).
- Decide version: patch/minor bump of `MARKETING_VERSION` if a new version, or keep it and only bump `CURRENT_PROJECT_VERSION` when re-uploading to the same in-flight version.

```bash
# bump build number (replace N with current, N+1 with next; sed hits both occurrences)
sed -i '' 's/CURRENT_PROJECT_VERSION = N;/CURRENT_PROJECT_VERSION = N+1;/g' ios/App/App.xcodeproj/project.pbxproj
```

## 2. Build web bundle + sync into iOS project

```bash
npm run cap:sync:ios   # runs build:mobile (tsc + vite --mode mobile) then cap sync ios
```

GOTCHA: `npx cap run ios` alone does NOT rebuild `dist/` — it deploys whatever is already there. Always rebuild first.

## 3. Validate on the simulator

```bash
xcrun simctl list devices available | grep -i iphone   # find a booted device or boot one
npx cap run ios --target <UDID>
sleep 4 && xcrun simctl io <UDID> screenshot /tmp/sim.png   # eyeball the screenshot
```

Let the user click through before proceeding.

## 4. Archive (CLI — no Xcode GUI needed for this step)

Use absolute paths; do not `cd` first (the user's shell profile breaks compound cd commands).

```bash
xcodebuild archive \
  -workspace /Users/kary/personal-projects/flashcards/ios/App/App.xcworkspace \
  -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ~/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Flashcards-<version>-b<build>.xcarchive \
  -allowProvisioningUpdates 2>&1 | tail -5   # expect "** ARCHIVE SUCCEEDED **"
```

## 5. Upload — user does this (Apple ID signing; Claude must not handle credentials)

```bash
open ~/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Flashcards-<version>-b<build>.xcarchive
```

This opens Xcode Organizer. User clicks: select archive → **Distribute App** → **App Store Connect** → **Upload**. Processing takes ~10–15 min (email arrives when done).

## 6. App Store Connect submission (in-flight version page)

Browser note: App Store Connect is logged in on the user's "Karina (Kary)" Chrome profile — connect to that browser before driving the page. Ask the user before clicking Save / Add for Review / Submit — these are submission actions on their account.

1. **Create the version if it doesn't exist**: app page → **+** next to "iOS App" in the left sidebar → enter the `MARKETING_VERSION`. The new version shows as "Prepare for Submission" (yellow dot) in the sidebar.
2. **Wait for build processing**: after the Organizer upload, the build takes ~10–15 min to process (user gets an email). Until then it won't appear in the Add Build dialog.
3. **Attach the build**: scroll to the **Build** section (mid-page, between "iMessage App" and "In-App Purchases and Subscriptions") → **Add Build** → select the new build number. Double-check the build number — older processed builds are also listed.
4. **What's New in This Version** — required; "Add for Review" stays disabled while it's empty. Plain user-facing release notes.
5. Fields that carry over from the previous version (verify, don't refill): screenshots, description, keywords, support URL, copyright, App Review contact info.
6. Optional fields that are fine to leave empty: Promotional Text, App Review notes, attachment, Routing App Coverage File.
7. Check the release settings at the bottom: **App Store Version Release** = "Automatically release this version" (current setting), Phased Release = immediate, Keep existing rating.
8. **Save** (top right) — Add for Review only enables after a successful save.
9. **Add for Review** → Apple shows a submission summary → **Submit**. Status changes to "Waiting for Review"; review typically takes 24–48 h, then the version releases automatically.

## 7. After submitting

- Commit the release: source changes + `project.pbxproj` version bump, e.g. `chore: release 1.1.1 (build 5)`.
- Watch for App Review emails (approval, or rejection with reasons on the version page under App Review).
- Once "Ready for Distribution", the sidebar shows the new version with a green check; the in-flight URL then points at nothing until the next version is created.

## Known one-off items (check until resolved)

- Age Ratings: answer Apple's new social-media questions (App Information → Age Ratings → Edit; all "No" — the app has no social features). Deadline Sept 7, 2026.
- Store checklist history and Android notes: `docs/mobile-release.md`.
