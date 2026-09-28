import { expect, test } from '@playwright/test'

test('desktop setup uses the available workspace', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Daily Vipassana' })).toBeVisible()
  const setup = await page.getByRole('main').boundingBox()
  await page.screenshot({ path: testInfo.outputPath('desktop-setup.png'), fullPage: true })
  expect(setup!.width).toBeGreaterThan(640)
})

test('desktop duration dialog sits near the controls, not the screen edge', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.locator('.duration-presets').getByRole('button', { name: 'Custom', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Meditation duration' })
  await expect(dialog).toBeVisible()
  const bounds = (await dialog.boundingBox())!
  await page.screenshot({ path: testInfo.outputPath('desktop-duration.png'), fullPage: true })
  expect.soft(bounds.width).toBeGreaterThanOrEqual(440)
  expect(Math.abs(bounds.y + bounds.height / 2 - 500)).toBeLessThan(40)
})

const viewports = [
  { name: 'small-phone', width: 320, height: 568, colorScheme: 'light' },
  { name: 'phone', width: 402, height: 874, colorScheme: 'dark' },
  { name: 'wide-phone', width: 600, height: 900, colorScheme: 'light' },
  { name: 'tablet', width: 768, height: 1024, colorScheme: 'light' },
  { name: 'small-window', width: 960, height: 720, colorScheme: 'dark' },
  { name: 'laptop', width: 1024, height: 768, colorScheme: 'light' },
  { name: 'desktop', width: 1440, height: 1000, colorScheme: 'dark' },
  { name: 'wide-desktop', width: 1920, height: 1080, colorScheme: 'light' },
  { name: 'ultrawide', width: 2560, height: 1440, colorScheme: 'dark' },
  { name: 'landscape-phone', width: 844, height: 390, colorScheme: 'dark' },
  { name: 'short-desktop', width: 1280, height: 500, colorScheme: 'light' },
  { name: 'reduced-phone-viewport', width: 402, height: 360, colorScheme: 'dark' },
] as const

for (const viewport of viewports) {
  test(`controls and dialogs remain usable on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ colorScheme: viewport.colorScheme })
    await page.clock.setFixedTime(new Date('2026-09-27T19:00:00-07:00'))
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Daily Vipassana' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const controls = (await page.locator('.setup-controls').boundingBox())!
    const summary = (await page.locator('.setup-footer').boundingBox())!
    if (viewport.width >= 1024) {
      expect(summary.x).toBeGreaterThan(controls.x + controls.width + 24)
      expect(Math.abs(summary.y - controls.y)).toBeLessThan(2)
    } else if (viewport.width >= 640) {
      expect(summary.y - controls.y - controls.height).toBeLessThanOrEqual(48)
    }
    await page.screenshot({ path: testInfo.outputPath('setup.png'), fullPage: true })

    // These use the real shared dialog seam: geometry, reachability and focus
    // must survive both its bottom-sheet and centred presentations.
    for (const panel of ['duration', 'audio', 'details', 'reminder']) {
      const trigger = panel === 'duration' ? page.locator('.duration-presets button').last()
        : panel === 'audio' ? page.getByRole('button', { name: /Audio & gongs/ })
        : panel === 'details' ? page.getByRole('button', { name: 'View session details' })
        : page.getByRole('button', { name: /Start session/ })
      await trigger.click()
      const dialog = page.getByRole('dialog')
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
      if (viewport.width >= 640 || panel === 'reminder') {
        expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2)
      } else {
        expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThan(2)
      }
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      const action = dialog.getByRole('button', { name: panel === 'reminder' ? 'Start session' : 'Done', exact: true })
      await action.scrollIntoViewIfNeeded()
      await expect(action).toBeInViewport()
      if (panel === 'duration' || panel === 'reminder') {
        await page.screenshot({ path: testInfo.outputPath(panel + '.png') })
      }
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
    }
    await page.getByRole('button', { name: 'Guided', exact: true }).click()
    await expect(page.getByLabel('Instructions', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('guided.png'), fullPage: true })
  })
}

test('an open duration draft and keyboard focus survive responsive reflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const trigger = page.locator('.duration-presets button').last()
  await trigger.click()
  const input = page.getByLabel('Minutes', { exact: true })
  await input.fill('75')
  for (const viewport of [{ width: 768, height: 1024 }, { width: 402, height: 874 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport)
    await expect(input).toHaveValue('75')
    await expect(input).toBeFocused()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true })).toBeInViewport()
  }
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(trigger).toHaveText('75 min')
  await expect(trigger).toBeFocused()
})

test('active session keeps its timer and actions proportionate on desktop', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: /Start session/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Start session', exact: true }).click()
  // Wait for actual playback before End: this change does not alter the
  // existing engine's behavior when audio is cancelled during loading.
  await expect.poll(async () => Number(await page.getByRole('progressbar', { name: 'Recording progress' }).getAttribute('value'))).toBeGreaterThan(0)
  await expect(page.getByRole('timer')).toBeInViewport()
  const end = page.getByRole('button', { name: 'End session' })
  await expect(end).toBeInViewport()
  expect((await end.boundingBox())!.width).toBeLessThanOrEqual(400)
  await page.screenshot({ path: testInfo.outputPath('active-desktop.png'), fullPage: true })
  await end.click()
  await expect(page.getByRole('button', { name: /Start session/ })).toBeVisible()
})
