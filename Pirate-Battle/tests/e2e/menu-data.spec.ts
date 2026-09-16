import { expect, test } from '@playwright/test'

test('shows ranking data and the local player match history tab through TanStack Query', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await expect(page.getByRole('tab', { name: 'Ranking' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText('No completed matches yet.')).toBeVisible()
})
