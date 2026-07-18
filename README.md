# PulseTodo

Permanent todo list with deadline support and a configurable **pulse reminder** every X minutes.

## What you get

- Add todos with optional deadlines
- Permanent on-device list (AsyncStorage)
- **Pulse interval** (default 15 minutes) — change anytime in-app under **Pulse**
- Tap a pulse notification → opens PulseTodo so you can skim / clear urgent items
- No interruption while the app is already open (you’re already on the list)

## Important iOS limit

Apple does **not** allow true system overlays above other apps on stock iOS. PulseTodo uses a repeating local notification every X minutes; tap it to open your list. If the app is already open, nothing pops up.

## Project location

`/home/autizchait/Desktop/PulseTodo`

---

## Free path: Linux + iPhone only (no Mac, no $99)

You cannot compile an iPhone IPA on Linux itself. The free workaround:

1. **GitHub Actions** (free macOS cloud) builds an **unsigned** `PulseTodo.ipa`
2. **SideStore** on your iPhone signs it with your **free Apple ID** and auto-refreshes ~every 7 days
3. Your todos are **kept** on refresh (same bundle id)

### 1) Build the IPA (from Linux)

```bash
cd ~/Desktop/PulseTodo

# Create an empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USER/PulseTodo.git
git add -A
git commit -m "PulseTodo: todos + pulse reminders"
git push -u origin HEAD
```

Prefer a **public** repo (more free macOS Action minutes).

Then on GitHub:

1. **Actions** → **Build iOS IPA (unsigned)** → **Run workflow**
2. Wait ~15–40 minutes
3. Open the finished run → **Artifacts** → **PulseTodo-ipa** → download
4. Unzip if needed — you want `PulseTodo.ipa`

Workflow file: `.github/workflows/build-ios-ipa.yml`

### 2) Install on iPhone (SideStore — automated refresh)

1. Set up [SideStore](https://sidestore.io/) (pairing + WireGuard VPN per their guide)
2. **My Apps → +** → pick `PulseTodo.ipa` → free Apple ID
3. **Settings → General → VPN & Device Management** → trust the cert
4. Open PulseTodo → allow notifications → set interval under **Pulse**
5. Keep SideStore’s VPN/pairing working so it can refresh before the 7-day expiry

**AltStore** also works if you prefer that ecosystem (needs AltServer on a PC periodically).

| | Free Apple ID + SideStore |
|--|---------------------------|
| Mac required? | No (GitHub builds the IPA) |
| Paid Developer Program? | No |
| Install lifetime | ~7 days, then auto-refresh |
| Data loss on refresh? | No (unless you delete the app) |

---

## Paid / optional alternatives

| Method | Cost | When to use |
|--------|------|-------------|
| EAS Build (`npm run build:ios`) | $99/yr Apple Developer | Smoother cloud builds if you already pay |
| Borrow a Mac + Xcode | Free if borrowed | One-time archive, then SideStore refresh |
| Sideloadly | Free Apple ID | Manual re-sign; prefer SideStore for automation |

### Mac + Xcode (optional)

```bash
npx expo prebuild --platform ios
# open ios/*.xcworkspace in Xcode → Archive → export IPA
```

### EAS (not free for device IPAs)

Needs paid Apple Developer. Fix project link with `npx eas init`, then `npm run build:ios`.

---

## Try UI without an IPA

```bash
cd ~/Desktop/PulseTodo
npx expo start
```

Expo Go is fine for UI; notifications work better in a real IPA.

## In-app controls

| Setting | Default | Where |
|--------|---------|--------|
| Reminder every X minutes | 15 | Pulse → Interval |
| Reminders on/off | On | Pulse → Reminders on |

## Bundle id

`com.pulsetodo.app` — keep this stable so refreshes never wipe your list.
