import { expect, test } from '@playwright/test';

const authTokenForRole = (role) => {
  const payload = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `test.${payload}.token`;
};

const signInAs = async (page, role) => {
  await page.addInitScript(
    ({ token, userRole }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
    },
    {
      token: authTokenForRole(role),
      userRole: role,
    },
  );
};

test('renders the healthcare login experience', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('CareSlot Health')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Coordinate care with a calmer, clearer dashboard.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
  await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
  await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
});

test('logs in and routes admins to the admin dashboard', async ({ page }) => {
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
  await page.getByPlaceholder('Enter your username').fill('admin');
  await page.getByPlaceholder('Enter your password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
});

test('redirects protected pages back to login when unauthenticated', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
});

test('submits provider availability from the user dashboard', async ({ page }) => {
  await signInAs(page, 'User');

  await page.route('**/api/availability', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Availability added successfully!' }),
    });
  });

  await page.goto('/user');
  await expect(page.getByRole('heading', { name: 'User Dashboard' })).toBeVisible();

  await page.getByLabel('Date').fill('2030-05-18');
  await page.getByLabel('Start Time').fill('09:00');
  await page.getByLabel('End Time').fill('10:00');
  await page.getByRole('button', { name: 'Add Availability' }).click();

  await expect(page.getByText('Availability added successfully!')).toBeVisible();
});

test('shows admin slot results and books an available slot', async ({ page }) => {
  await signInAs(page, 'Admin');

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

  await page.goto('/admin');
  await page.getByLabel('Select Date').fill('2030-05-18');
  await page.getByRole('button', { name: 'View Available Slots' }).click();

  await expect(page.getByRole('heading', { name: 'Available Slots for 2030-05-18' })).toBeVisible();
  await expect(page.getByText('2 slots')).toBeVisible();
  await expect(page.getByText('dr.smith')).toBeVisible();
  await expect(page.getByText('Booked')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Book Slot' }).click();
});
