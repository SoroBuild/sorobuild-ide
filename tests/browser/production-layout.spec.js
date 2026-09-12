import { test, expect } from '@playwright/test';
test('preserves the production full-window layout, collapsible header and project modal', async ({ page }) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://api.github.com/repos/stellar/soroban-examples/contents**',route=>route.fulfill({json:[{name:'hello_world',path:'hello_world',type:'dir'}]}));
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  const shell = page.locator('#root > div').first();
  const bounds = await shell.boundingBox();
  expect(bounds.width).toBe(page.viewportSize().width);
  expect(bounds.height).toBe(page.viewportSize().height);
  await page.screenshot({path:'test-results/production-layout.png',fullPage:true});
  await page.getByRole('button',{name:'Open top panel'}).click();
  await page.getByRole('button',{name:'Collapse top panel'}).click();
  await expect(page.getByRole('button',{name:'Open top panel'})).toBeVisible();
  await page.getByRole('button',{name:'Open top panel'}).click();
  await page.getByRole('button',{name:'Load Soroban project',exact:true}).click();
  await expect(page.getByText('Load Soroban Project',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('secondary actions support keyboard navigation and escape', async ({ page }) => {
  await page.goto('/');
  const trigger=page.getByRole('button',{name:'More actions'});
  await trigger.focus(); await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem',{name:'Import folder'})).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem',{name:'Command Palette'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('smaller screens prioritize the editor without overflowing the header', async ({ page }) => {
  await page.setViewportSize({width:1024,height:768});
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await expect(page.getByRole('button',{name:'Show workbench'})).toBeVisible();
  const wallet=await page.getByRole('button',{name:'Connect Wallet'}).boundingBox();
  expect(wallet.x+wallet.width).toBeLessThanOrEqual(1024);
  const header=await page.locator('.workspace-header').boundingBox();
  expect(header.height).toBeLessThan(70);
  await page.screenshot({path:'test-results/production-compact.png',fullPage:true});
});
