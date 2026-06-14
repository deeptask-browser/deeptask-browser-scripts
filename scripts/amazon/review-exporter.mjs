// @name         Amazon Review Exporter
// @description  Scrape and export product reviews to a CSV file for sentiment analysis
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   asin: string      - Amazon ASIN of the product
 *   pages: number     - Number of review pages to scrape (default: 3)
 *   marketplace: string - Amazon marketplace domain (default: "amazon.com")
 */
export default async function run({ page, params, output }) {
  const { asin, pages = 3, marketplace = 'amazon.com' } = params

  if (!asin) throw new Error('Parameter "asin" is required')

  const reviews = []

  for (let p = 1; p <= pages; p++) {
    const url = `https://www.${marketplace}/product-reviews/${asin}?pageNumber=${p}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const pageReviews = await page.$$eval('[data-hook="review"]', (els) =>
      els.map((el) => ({
        title: el.querySelector('[data-hook="review-title"] span:last-child')?.textContent?.trim() ?? '',
        rating: el.querySelector('[data-hook="review-star-rating"] span')?.textContent?.trim() ?? '',
        date: el.querySelector('[data-hook="review-date"]')?.textContent?.trim() ?? '',
        body: el.querySelector('[data-hook="review-body"] span')?.textContent?.trim() ?? '',
        verified: !!el.querySelector('[data-hook="avp-badge"]')
      }))
    )

    reviews.push(...pageReviews)
    if (pageReviews.length === 0) break
  }

  await output.writeCsv('reviews.csv', reviews, ['title', 'rating', 'date', 'verified', 'body'])

  return { success: true, count: reviews.length }
}
