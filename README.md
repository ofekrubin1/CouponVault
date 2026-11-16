# CouponVault

Family coupon & voucher manager (Hebrew, RTL, mobile-first). Track where each coupon came from, where it can be used, and when it expires. Coupons about to expire pop up on the home screen. Several users share a "family"; a user can belong to several families.

## Run

```
npm install
npm run dev           # http://localhost:5173 (against the real Firebase project, Google login)
npm run build         # production build -> dist/
npm run deploy:rules  # Firestore rules
npm run deploy        # build + Firebase Hosting
```

## Code layout (`src/`)

```
domain/     pure rules: expiry, redemption math, form validation, filters (no React/Firebase, unit-tested)
data/       Firestore access per entity (users, families, coupons) + background writes / live listeners
services/   Firebase setup, sign-in
ui/         design system (Card, Button, Sheet, Toast, ConfirmDialog, fields) – knows nothing about coupons
hooks/      generic hooks (scroll lock, back button, keyboard-aware viewport)
features/   one folder per area: auth, families, coupons (ticket/detail/form), home, archive, settings
app/        shell: providers, auth gate, header, tabs, bottom bar, sheets
```

## Tests

All against the local Firebase emulators (Java required), never production data.

```
npm run test:unit     # date / value / sorting logic (Vitest)
npm run test:rules    # Firestore security rules
npm run test:e2e      # the app end to end: iPhone (WebKit) + Android (Chromium), Playwright
npm test              # all of the above
```

Firebase project: `couponvault-2026` (Firestore + Google Auth + Hosting).
