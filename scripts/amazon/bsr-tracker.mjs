// @name         Amazon BSR Tracker
// @description  Track Best Seller Rank changes for a list of ASINs over time
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   asins: string[]     - List of Amazon ASINs to track
 *   marketplace: string - Amazon marketplace domain (default: "amazon.com")
 */
export default async function run({ page, params, output }) {
  const { asins = [], marketplace = 'amazon.com' } = params

  const results = []
  const timestamp = new Date().toISOString()

  for (const asin of asins) {
    await page.goto(`https://www.${marketplace}/dp/${asin}`, { waitUntil: 'domcontentloaded' })

    const title = await page.$eval('#productTitle', (el) => el.textContent.trim()).catch(() => 'N/A')
    const bsrText = await page
      .$$eval('#detailBulletsWrapper_feature_div li, #productDetails_detailBullets_sections1 tr', (els) => {
        const bsr = els.find((el) => el.textContent.includes('Best Sellers Rank'))
        return bsr?.textContent?.trim() ?? ''
      })
      .catch(() => '')

    const rankMatch = bsrText.match(/#([\d,]+)/)
    const rank = rankMatch ? parseInt(rankMatch[1].replace(/,/g, ''), 10) : null

    results.push({ asin, title, rank, timestamp })
  }

  await output.writeJson('bsr-snapshot.json', results)

  return { success: true, count: results.length }
}
