import { expect, test } from '@playwright/test'

test.use({ hasTouch: true })

test('touch dialogs keep button focus without drawing keyboard outlines', async ({ page }, testInfo) => {
  await page.goto('/')
  const triggers = [
    page.getByRole('button', { name: 'View session details' }),
    page.getByRole('button', { name: /Audio & gongs/ }),
    page.locator('.duration-presets button').last(),
    page.getByRole('button', { name: /Start session/ }),
  ]
  for (const trigger of triggers) {
    await trigger.tap()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // WebKit may mark a programmatically focused modal button focus-visible
    // even though the user opened it by touch.
    await expect(dialog.locator('button:focus')).toHaveCSS('outline-style', 'none')
    await dialog.getByRole('button', { name: /^Close / }).tap()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveCSS('outline-style', 'none')
  }
  await triggers[2].tap()
  const minutes = page.getByLabel('Minutes', { exact: true })
  await minutes.tap()
  await expect(minutes).toHaveCSS('outline-style', 'solid')
  await minutes.fill('75')
  await page.getByRole('button', { name: 'Done', exact: true }).tap()
  await expect(triggers[2]).toHaveText('75 min')
  await expect(triggers[2]).toBeFocused()
  await expect(triggers[2]).toHaveCSS('outline-style', 'none')
  await triggers[0].tap()
  await page.getByRole('button', { name: 'Done', exact: true }).tap()
  await expect(triggers[0]).toHaveCSS('outline-style', 'none')
  await page.screenshot({ path: testInfo.outputPath('touch-details-dismissed.png'), fullPage: true })
})

test('keyboard focus remains visible after touch, in dialogs and on return', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'View session details' })
  await trigger.tap()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('dialog').locator('button:focus')).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog').locator('button:focus')).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveCSS('outline-style', 'solid')
  // A new tap returns to touch presentation, including focus restored by JS.
  await trigger.tap()
  await page.getByRole('button', { name: 'Done', exact: true }).tap()
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveCSS('outline-style', 'none')
})
