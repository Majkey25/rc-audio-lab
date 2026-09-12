import { test, expect } from '@playwright/test'

test('running audio A/B changes the measured output, not just the button state', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await page.getByRole('combobox', { name: 'Sound', exact: true }).selectOption('noise')
  await page.getByRole('button', { name: '▶ Start audio' }).click()
  const curve = page.getByTestId('measured-response')
  await expect(curve).toBeVisible()
  const meanY = () => curve.evaluate(node => {
    const points = [...(node.getAttribute('d') || '').matchAll(/[ML]([-\d.]+),([-\d.]+)/g)]
    return points.reduce((sum, point) => sum + Number(point[2]), 0) / points.length
  })
  await expect.poll(meanY).toBeGreaterThan(50)
  const filtered = await meanY()
  await page.getByRole('button', { name: 'A · Bypass', exact: true }).click()
  await expect.poll(meanY).toBeLessThan(filtered - 10)
  const bypass = await meanY()
  await page.getByRole('button', { name: 'B · Filtered', exact: true }).click()
  await expect.poll(meanY).toBeGreaterThan(bypass + 10)
  await page.getByRole('button', { name: 'Stop audio' }).click()
})
