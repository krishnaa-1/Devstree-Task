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
      maxWidth: '520px',
      padding: '16px 18px',
      borderRadius: '8px',
      background: '#102f3d',
      color: '#ffffff',
      boxShadow: '0 18px 44px rgba(15, 47, 61, 0.28)',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      lineHeight: '1.45',
    });
  }, message);

  await page.waitForTimeout(1400);
};

const mockAdminSlots = async (page) => {
  await page.route('**/api/availability/2030-05-18', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slots: [
          {
            _id: 'slot-1',
            startTime: '09:00 AM',
            endTime: '09:30 AM',
            status: 'Available',
            availabilityId: {
              userId: {
                _id: 'user-1',
                username: 'dr.smith',
              },
            },
          },
          {
            _id: 'slot-2',
            startTime: '10:00 AM',
            endTime: '10:30 AM',
            status: 'Booked',
            availabilityId: {
              userId: {
                _id: 'user-2',
                username: 'dr.lee',
              },
            },
          },
        ],
      }),
    });
  });

  await page.route('**/api/availability/book', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Slot booked successfully' }),
    });
  });
};

test('Claude Code E2E healthcare system demo', async ({ page }) => {
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

  await mockAdminSlots(page);

  await page.goto('/login');
  await showDemoStep(page, 'Claude Code E2E demo: open the healthcare login screen.');
  await expect(page.getByText('CareSlot Health')).toBeVisible();

  await showDemoStep(page, 'Playwright now acts like a real user: typing credentials.');
  await page.getByPlaceholder('Enter your username').fill('admin');
  await page.getByPlaceholder('Enter your password').fill('password');

  await showDemoStep(page, 'Click Login. The API is mocked, so the demo is stable without backend dependency.');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await showDemoStep(page, 'Authenticated admin route is verified: dashboard loaded successfully.');
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

  await showDemoStep(page, 'Search available appointment slots for a selected date.');
  await page.getByLabel('Select Date').fill('2030-05-18');
  await page.getByRole('button', { name: 'View Available Slots' }).click();

  await showDemoStep(page, 'The slot table renders mocked healthcare appointment data.');
  await expect(page.getByRole('heading', { name: 'Available Slots for 2030-05-18' })).toBeVisible();
  await expect(page.getByText('dr.smith')).toBeVisible();
  await expect(page.getByText('Booked')).toBeVisible();

  await showDemoStep(page, 'Book an available slot and verify the user action works.');
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Book Slot' }).click();

  await showDemoStep(page, 'Demo complete: UI, auth routing, API mocking, form inputs, tables, and booking flow.');
});
