# Expiring filter, backup removal and security hardening — design

Date: 2026-11-24. Agreed with the user in conversation; items marked *(my call)* are defaults I chose and stated.

## Why

- Home: reaching the coupons about to expire should be one tap, without cluttering the compact list.
- Security: the app holds coupon codes that are worth money. Three real gaps: a leaked invite code gives
  instant full access; anyone holding an unlocked phone sees every code; signing out leaves the data on the device.

## Approaches considered (expiring filter)

Pinned "about to expire" group, two tabs, a filter button by the search, a banner. The user picked the toggle
button beside the search (from the tabs option), smaller, with the search taking the full width while typing.

## 1. Expiring filter (home)

- A toggle "⏰ פגים בקרוב N" on the left of the search field, compact (small text and padding).
- On: only coupons inside the user's alert window, still grouped by category. Off: every coupon.
- While the search field is focused the toggle hides and the search takes the full width; it returns on blur.
- *(my call)* With the filter on and the search focused, the placeholder reads "חיפוש בפגים בקרוב…".
- *(my call)* With no coupons about to expire the toggle shows greyed and disabled (no width jumps); if the
  filter is on and the last one goes away, it turns off by itself.
- The red pill by the balance (previous round) is removed.

## 2. Backup: removed

The settings backup card and its code (JSON export, save-as) are removed entirely, including from production.
The coupon share (image) stays.

## 3. Security

### א. Signing out clears this device
Sign-out stops Firestore, clears its offline cache (IndexedDB) and reloads, so nothing stays on a shared device.

### ב. Invite codes: 8 characters, valid for 7 days
- New codes are 8 characters (same unambiguous alphabet). The invite record stores `createdAt` (server time,
  enforced by the rules) and the family's name for the waiting screen.
- The rules accept a code only within 7 days of `createdAt`. Older codes (6 characters, no date) no longer work.
- Settings shows when the code expires, and "פג תוקף" with a one-tap "new code" when it has.

### ד. Joining needs a member's approval
- Entering a valid code creates a join request (`families/{fid}/requests/{uid}`) instead of joining. The rules
  allow it only with a valid, unexpired code, and only for oneself.
- The self-join path in the rules is removed: only a member can add someone to `members`.
- The requester sees "waiting for approval" (family name from the invite) and can cancel. When approved the
  family simply appears; when declined they're told so.
- Members see pending requests in Settings (Members card) with approve / decline, and a badge on the settings tab.
- *(my call)* Any member can approve or decline (there is no family admin; the user dropped that item).

### ג. Hosting security headers
`X-Frame-Options: DENY`, CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
(camera, microphone, geolocation off). *(my call)* No full script/connect CSP: it can't be tested against
Google sign-in before production and could lock users out.

### ה. Face ID / fingerprint on opening the app (optional, per person and device)
- Offered once right after the first sign-in on a device, when it has a biometric unlock; also a switch in Settings.
- When on, opening the app (a fresh start) shows a lock screen with "פתיחה עם Face ID"; the app opens after a
  successful check. Sign-out is offered there as the way out.
- No lock after time in the background, and codes stay visible (the user said not now).
- WebAuthn platform authenticator with user verification; the credential id is kept on the device. It's a
  privacy gate on the device, not a server login (the Google sign-in stays the real one).

## Not doing
Backup password (no backup), family admin role, App Check, background auto-lock, hidden codes.

## Testing
Unit tests for invite rules and filter logic; Firestore rules tests for requests, expiry and the removed self-join;
Playwright on iPhone + Android for the filter, sign-out cleanup, the full join-approval flow between two phones,
code expiry, and the lock (virtual authenticator / stubbed WebAuthn). Then a QA pass in the local test environment.

## Update 2026-11-27: Face ID removed
Section ה was shipped and then removed at the user's request, after a first unlock on a real iPhone did not find
the saved key ("no passkeys for this website"). Phones that had turned it on forget the setting on the next start.
