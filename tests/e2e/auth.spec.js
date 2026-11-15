import { test, expect } from '@playwright/test';
import { login, noHorizontalOverflow, setup, tab } from './helpers';

test('T01 login screen: Google button, no sideways scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'CouponVault' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'התחברות עם Google' })).toBeVisible();
  await noHorizontalOverflow(page);
});

test('T02 first sign-in lands on the welcome screen with the first name', async ({ page }) => {
  await login(page, { name: 'אופק רובין' });
  await expect(page.getByRole('heading', { name: /שלום אופק/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /משפחה חדשה/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /הצטרפות בקוד/ })).toBeVisible();
});

test('T03 sign out from settings returns to the login screen', async ({ page }) => {
  await setup(page);
  await tab(page, 'הגדרות');
  await page.getByRole('button', { name: 'התנתקות' }).click();
  await expect(page.getByRole('button', { name: 'התחברות עם Google' })).toBeVisible();
});
