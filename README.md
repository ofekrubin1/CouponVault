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

## Tests

All against the local Firebase emulators (Java required), never production data.

```
npm run test:unit     # date / value / sorting logic (Vitest)
npm run test:rules    # Firestore security rules
npm run test:e2e      # the app end to end: iPhone (WebKit) + Android (Chromium), Playwright
npm test              # all of the above
```

Firebase project: `couponvault-2026` (Firestore + Google Auth + Hosting).
