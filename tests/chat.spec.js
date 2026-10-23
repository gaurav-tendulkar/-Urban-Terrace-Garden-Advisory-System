const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/chat');
});

test('home page demonstrates how to build a garden', async ({ page }) => {
  await page.goto('/');

  const section = page.locator('#garden-demo');
  await expect(section.getByRole('heading', { name: 'See your garden come together.' })).toBeVisible();
  await expect(section.getByText('Set your space')).toBeVisible();
  await expect(section.getByText('Add beds and paths')).toBeVisible();
  await expect(section.getByText('Plant, decorate, save')).toBeVisible();
  await expect(section.getByRole('link', { name: 'Try the Garden Studio' })).toHaveAttribute('href', '/build-garden');
  await expect(section.getByRole('img', { name: /Animated preview/ })).toBeVisible();
  await expect(section.locator('.garden-demo-bed-one')).toHaveCSS('animation-name', 'garden-demo-bed');
  await expect(section.locator('.garden-demo-path')).toHaveCSS('animation-name', 'garden-demo-path');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(section.locator('.garden-demo-bed-one')).toHaveCSS('animation-name', 'none');
});

test('mobile home navigation keeps the Talk to AI link visible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');

  const talkToAiLink = page.locator('.home-nav-ai-cta');
  await expect(talkToAiLink).toBeVisible();
  await expect(talkToAiLink).toHaveAttribute('href', '/chat');
  await expect(page.locator('.home-nav-menu-toggle')).toBeVisible();
  await expect(page.locator('.home-nav-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.home-nav-links')).toBeHidden();
  expect(await page.locator('body').evaluate((body) => body.scrollWidth))
    .toBeLessThanOrEqual(320);

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('link', { name: 'Build Garden' })).toBeVisible();
  await expect(page.locator('.home-nav-menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(talkToAiLink).toBeVisible();
});

test('suggested question sends a message and renders the advisor reply', async ({ page }) => {
  let requestBody;

  await page.route('**/api/chat', async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: 'Basil and thyme are good sunny-balcony choices.' }),
    });
  });

  const question = 'What can I grow on a sunny balcony?';
  await page.getByRole('button', { name: question }).click();

  await expect(page.locator('.user-message .message-content')).toHaveText(question);
  await expect(page.locator('.bot-message .message-content').last())
    .toContainText('Basil and thyme are good sunny-balcony choices.');
  expect(requestBody).toMatchObject({
    message: question,
    history: [],
  });
  await expect(page.getByRole('group', { name: 'Suggested questions' })).toHaveCount(0);
});

test('sanitizes unsafe HTML returned in an advisor Markdown response', async ({ page }) => {
  await page.evaluate(() => {
    window.__chatXssExecuted = false;
  });

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: '<img src=x onerror="window.__chatXssExecuted = true"><script>window.__chatXssExecuted = true</script><strong>Safe reply</strong>',
      }),
    });
  });

  await page.getByLabel('Message Botanica').fill('Please reply safely');
  await page.getByRole('button', { name: 'Send message' }).click();

  const reply = page.locator('.bot-message .message-content').last();
  await expect(reply).toContainText('Safe reply');
  await expect(reply.locator('script')).toHaveCount(0);
  await expect(reply.locator('[onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__chatXssExecuted)).toBe(false);
});

test('saves garden designs privately in this browser without calling the shared API', async ({ page, browser }) => {
  const gardenApiRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/gardens')) gardenApiRequests.push(request.url());
  });

  await page.goto('/build-garden');
  await expect(page.getByRole('status')).toContainText('private to this browser');
  await page.getByLabel('Design Name').fill('My Private Terrace');
  await page.getByRole('button', { name: 'Save Current Design' }).click();
  await expect(page.getByRole('status')).toContainText('saved successfully');
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('botanica-garden-designs-v1') || '{}')
  ))).toHaveProperty('My Private Terrace');

  await page.reload();
  await expect(page.locator('#saved-designs')).toContainText('My Private Terrace');
  expect(gardenApiRequests).toEqual([]);

  const otherBrowser = await browser.newPage();
  await otherBrowser.goto('/build-garden');
  await expect(otherBrowser.locator('#saved-designs')).not.toContainText('My Private Terrace');
  await otherBrowser.close();
});

test('rejects a reserved prototype property as a garden design name', async ({ page }) => {
  await page.goto('/build-garden');
  await page.getByLabel('Design Name').fill('__proto__');
  await page.getByRole('button', { name: 'Save Current Design' }).click();

  await expect(page.getByRole('status'))
    .toContainText('This design name is reserved.');
  expect(await page.evaluate(() => (
    Object.hasOwn(
      JSON.parse(localStorage.getItem('botanica-garden-designs-v1') || '{}'),
      '__proto__',
    )
  ))).toBe(false);
});

test('does not show a rename action for saved garden designs', async ({ page }) => {
  await page.goto('/build-garden');
  await page.getByLabel('Design Name').fill('Morning Garden');
  await page.getByRole('button', { name: 'Save Current Design' }).click();
  await expect(page.getByRole('status')).toContainText('saved successfully');

  await page.locator('#saved-designs').selectOption({ label: 'Morning Garden' });
  await expect(page.getByRole('button', { name: 'Rename' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
});

test('validates oversized chat input and rate-limits repeated API requests', async ({ request }) => {
  const backendUrl = 'http://127.0.0.1:4317/api/chat';
  const oversizedMessage = await request.post(backendUrl, {
    data: { message: 'x'.repeat(4001) },
  });
  expect(oversizedMessage.status()).toBe(400);

  const oversizedHistory = await request.post(backendUrl, {
    data: {
      message: 'Please help with my garden.',
      history: [{ role: 'model', parts: [{ text: 'x'.repeat(12001) }] }],
    },
  });
  expect(oversizedHistory.status()).toBe(400);

  for (let attempt = 1; attempt < 19; attempt += 1) {
    const invalidMessage = await request.post(backendUrl, {
      data: { message: '' },
    });
    expect(invalidMessage.status()).toBe(400);
  }

  const rateLimited = await request.post(backendUrl, {
    data: { message: '' },
  });
  expect(rateLimited.status()).toBe(429);
});
