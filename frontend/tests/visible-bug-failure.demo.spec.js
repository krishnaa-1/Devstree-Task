import { expect, test } from '@playwright/test';

const authTokenForRole = (role) => {
  const payload = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `test.${payload}.token`;
};

const showDemoStep = async (page, message) => {
  await page.evaluate((text) => {
    let banner = document.querySelector('[data-demo-banner]');

    if (!banner) {
      banner = document.createElement('div');
      banner.setAttribute('data-demo-banner', 'true');
      document.body.appendChild(banner);
    }

    banner.textContent = text;
    Object.assign(banner.style, {
      position: 'fixed',
      left: '24px',
      bottom: '24px',
      zIndex: '99999',
      maxWidth: '560px',
      padding: '16px 18px',
      borderRadius: '8px',
      background: '#7f1d1d',
      color: '#ffffff',
      boxShadow: '0 18px 44px rgba(127, 29, 29, 0.28)',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      lineHeight: '1.45',
    });
  }, message);

  await page.waitForTimeout(1200);
};

test('visible failure demo: login placeholder regression', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: authTokenForRole('Admin'),
        role: 'Admin',
      }),
    });
  });

  await page.goto('/login');
  await showDemoStep(page, 'Bug demo: Playwright opens the login screen and checks the UI contract.');

  await page.getByPlaceholder('Enter your username').fill('admin');
  await showDemoStep(
    page,
    'Expected password placeholder: "Enter your password". If the UI says something else, this test fails and captures a screenshot.',
  );

  const passwordInput = page.getByPlaceholder('Enter your password');
  await expect(passwordInput).toBeVisible({ timeout: 5000 });

  await passwordInput.fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
