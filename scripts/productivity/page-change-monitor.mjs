// @name         Page Change Monitor
// @description  Watch a URL for content changes and send a desktop notification when detected
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   url: string      - Page URL to monitor
 *   selector: string - CSS selector of the element to watch (default: "body")
 *   intervalMs: number - Polling interval in ms (default: 60000)
 *   maxChecks: number  - Maximum number of checks before stopping (default: 60)
 */
export default async function run({ page, params, output, notify }) {
  const { url, selector = 'body', intervalMs = 60000, maxChecks = 60 } = params

  if (!url) throw new Error('Parameter "url" is required')

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  let lastContent = await page.$eval(selector, (el) => el.textContent?.trim() ?? '').catch(() => '')

  const log = [{ timestamp: new Date().toISOString(), event: 'baseline', content: lastContent.slice(0, 200) }]

  for (let i = 0; i < maxChecks; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))

    await page.reload({ waitUntil: 'domcontentloaded' })
    const current = await page.$eval(selector, (el) => el.textContent?.trim() ?? '').catch(() => '')

    if (current !== lastContent) {
      const entry = { timestamp: new Date().toISOString(), event: 'changed', content: current.slice(0, 200) }
      log.push(entry)
      await notify?.(`Page changed: ${url}`)
      lastContent = current
    }
  }

  await output.writeJson('change-log.json', log)

  return { success: true, checks: maxChecks, changes: log.filter((e) => e.event === 'changed').length }
}
