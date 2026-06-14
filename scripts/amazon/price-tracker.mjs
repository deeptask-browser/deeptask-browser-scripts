// @name         Amazon Price Tracker
// @description  Monitor competitor prices across Amazon listings and generate a comparison report
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   asins: string[]  - List of Amazon ASINs to track (e.g. ["B08N5WRWNW", "B09G3HRMVB"])
 *   marketplace: string - Amazon marketplace domain (default: "amazon.com")
 */
export default async function run({ page, params, output }) {
  const { asins = [], marketplace = 'amazon.com' } = params

  const results = []

  for (const asin of asins) {
    const url = `https://www.${marketplace}/dp/${asin}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const title = await page.$eval('#productTitle', (el) => el.textContent.trim()).catch(() => 'N/A')
    const price = await page
      .$eval('.a-price .a-offscreen', (el) => el.textContent.trim())
      .catch(() => 'N/A')

    results.push({ asin, title, price, url })
  }

  await output.writeJson('price-report.json', results)
  await output.writeCsv('price-report.csv', results, ['asin', 'title', 'price', 'url'])

  return { success: true, count: results.length }
}
