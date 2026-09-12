import { mockFunding } from './funding';
import { test, expect } from '@playwright/test';

test('editor loads locally, preserves empty files, and generates session-only accounts', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => !localStorage.getItem('soroban_studio_workspace_v2') && localStorage.setItem('soroban_studio_workspace_v2', JSON.stringify({ files: { 'empty.rs': 'clear me', 'Cargo.toml': '[package]\nname="test"' }, activeFile: 'empty.rs', openTabs: ['empty.rs'] })));
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('soroban_studio_workspace_v2')).files['empty.rs'])).toBe('');
  await page.getByRole('button', { name: 'Cargo.toml', exact: true }).first().click();
  await page.getByRole('button', { name: 'empty.rs', exact: true }).first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('soroban_studio_workspace_v2')).files['empty.rs'])).toBe('');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Generate Address', exact: true }).click();
  await expect(page.getByText('Test account 1', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export key', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('soroban_studio_workspace_v2')));
  expect(saved.files['empty.rs']).toBe('');
  expect(saved.generatedAddresses).toBeUndefined();
  expect(JSON.stringify(saved)).not.toMatch(/"secret"/);
  await page.reload();
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('soroban_studio_workspace_v2')).files['empty.rs'])).toBe('');
  await expect(page.getByText('Test account 1', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.beforeEach(async ({ page }) => { await mockFunding(page); await page.route('**/api/projects', route => route.fulfill({ status: 201, json: { projectId: '12345678-1234-4234-8234-123456789012', projectToken: 'test-token', revision: 1 } })); });

test('failed builds report compiler output and never create artifacts', async ({ page }) => {
  await page.route('**/api/projects/*/format', route => route.fulfill({json:{success:true,files:route.request().postDataJSON().files}}));
  await page.route('**/api/projects/*/build', route => route.fulfill({ json: { success: false, output: 'error[E0425]: cannot find value missing', artifacts: [] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Compile', exact: true }).click();
  await expect(page.getByText('error[E0425]: cannot find value missing', { exact: true })).toBeVisible();
  await expect(page.getByText('Build failed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'deploy', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Deploy selected WASM' })).toBeDisabled();
});

test('AI edits require review and cannot overwrite a changed file', async ({ page }) => {
  await page.route('**/api/projects/*/assistant', route => route.fulfill({ json: { answer: 'Use checked arithmetic.', path: 'hello_world/src/lib.rs', content: '// reviewed replacement' } }));
  await page.goto('/');
  await page.getByPlaceholder('Ask anything about your contract, tests, or network simulation...').fill('Fix overflow');
  await page.getByRole('button', { name: 'Ask Assistant', exact: true }).click();
  await expect(page.getByText('Use checked arithmetic.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('sorobuild:workspace:12345678-1234-4234-8234-123456789012')))).toBe(true);
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sorobuild:workspace:12345678-1234-4234-8234-123456789012')));
  expect(saved.files['hello_world/src/lib.rs']).toContain('#![no_std]');
  await page.getByRole('button', { name: 'Apply reviewed change' }).click();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('sorobuild:workspace:12345678-1234-4234-8234-123456789012')).files['hello_world/src/lib.rs'])).toBe('// reviewed replacement');
});

test('a reviewed AI suggestion cannot replace subsequent manual edits', async ({ page }) => {
  await page.route('**/api/projects/*/assistant', route => route.fulfill({ json: { answer: 'Proposed change.', path: 'hello_world/src/lib.rs', content: '// proposed' } }));
  await page.goto('/');
  await page.getByPlaceholder('Ask anything about your contract, tests, or network simulation...').fill('Propose a change');
  await page.getByRole('button', { name: 'Ask Assistant', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply reviewed change' })).toBeEnabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply reviewed change' })).toBeDisabled();
});
