import { test, expect } from '@playwright/test';
import { createFamily, login, tab } from './helpers';

/**
 * The test browsers have no Face ID / fingerprint, so the device's authenticator is replaced by a stand-in.
 * `biometrics`: whether the device has one. window.__recognise decides whether the next check succeeds.
 */
async function fakeBiometrics(page, { biometrics = true } = {}) {
  await page.addInitScript((has) => {
    window.__fakeBiometrics = true;
    window.__recognise = true;
    window.__checks = 0;
    window.PublicKeyCredential = { isUserVerifyingPlatformAuthenticatorAvailable: async () => has };
    // (WebKit won't let the methods be overwritten one by one: replace the whole container)
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        create: async () => ({ rawId: new Uint8Array([7, 7, 7]).buffer }),
        get: async () => {
          window.__checks += 1;
          if (!window.__recognise) throw new DOMException('not recognised', 'NotAllowedError');
          return {};
        },
      },
    });
  }, biometrics);
}

test('T78 Face ID is offered once after the first sign-in; when on, opening the app asks for it', async ({ page }) => {
  await fakeBiometrics(page);
  await login(page);
  await createFamily(page);
  const offer = page.getByTestId('lock-offer');
  await expect(offer).toBeVisible();
  await offer.getByRole('button', { name: 'הפעלה' }).click();
  await expect(offer).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('הופעלה');

  // opening the app again: locked until recognised
  await page.reload();
  const lock = page.getByTestId('lock-screen');
  await expect(lock).toBeVisible();
  await expect(page.locator('[data-family-id]')).toHaveCount(0);
  await page.evaluate(() => {
    window.__recognise = false;
  });
  await page.getByTestId('unlock-button').click();
  await expect(lock.getByRole('alert')).toHaveText('לא זוהית. נסו שוב');
  await page.evaluate(() => {
    window.__recognise = true;
  });
  await page.getByTestId('unlock-button').click();
  await expect(page.locator('[data-family-id]')).toBeVisible();
  // the offer doesn't come back
  await expect(page.getByTestId('lock-offer')).toHaveCount(0);
});

test('T79 "not now": no lock and no second offer; it can be turned on and off in Settings', async ({ page }) => {
  await fakeBiometrics(page);
  await login(page);
  await createFamily(page);
  await page.getByTestId('lock-offer').getByRole('button', { name: 'לא עכשיו' }).click();
  await page.reload();
  await expect(page.locator('[data-family-id]')).toBeVisible();
  await expect(page.getByTestId('lock-screen')).toHaveCount(0);
  await expect(page.getByTestId('lock-offer')).toHaveCount(0);

  await tab(page, 'הגדרות');
  const sw = page.getByRole('switch', { name: 'נעילה עם Face ID / טביעת אצבע' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByTestId('lock-screen')).toBeVisible();
  await page.getByTestId('unlock-button').click();
  await tab(page, 'הגדרות');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(page.locator('[data-family-id]')).toBeVisible();
  await expect(page.getByTestId('lock-screen')).toHaveCount(0);
});

test('T80 a device without Face ID / fingerprint gets no offer and no switch', async ({ page }) => {
  await fakeBiometrics(page, { biometrics: false });
  await login(page);
  await createFamily(page);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('lock-offer')).toHaveCount(0);
  await tab(page, 'הגדרות');
  await expect(page.getByRole('switch', { name: 'נעילה עם Face ID / טביעת אצבע' })).toHaveCount(0);
});

test('T81 signing out from the lock screen forgets the lock on this device', async ({ page }) => {
  await fakeBiometrics(page);
  await login(page);
  await createFamily(page);
  await page.getByTestId('lock-offer').getByRole('button', { name: 'הפעלה' }).click();
  await page.reload();
  await page.getByTestId('lock-screen').getByRole('button', { name: /התנתקות/ }).click();
  await expect(page.getByRole('button', { name: /התחברות עם Google/ })).toBeVisible();
  // (sign-out reloads the page; a check that lands on the reload just tries again)
  await expect
    .poll(() => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('cv-lock'))).catch(() => ['(reloading)']))
    .toEqual([]);
});
