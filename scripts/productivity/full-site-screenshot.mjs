// @name         Full-Site Screenshot
// @description  Crawl all internal links of a site and save full-page screenshots to a local folder
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   startUrl: string - Root URL to start crawling from
 *   maxPages: number - Maximum number of pages to screenshot (default: 20)
 */
export default async function run({ page, params, output }) {
  const { startUrl, maxPages = 20 } = params

  if (!startUrl) throw new Error('Parameter "startUrl" is required')

  const origin = new URL(startUrl).origin
  const visited = new Set()
  const queue = [startUrl]
  const results = []

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()
    if (visited.has(url)) continue
    visited.add(url)

    await page.goto(url, { waitUntil: 'networkidle2' })

    const slug = url.replace(origin, '').replace(/[^a-z0-9]/gi, '_').slice(0, 60) || 'index'
    const filename = `${slug}.png`
    const screenshot = await page.screenshot({ fullPage: true })
    await output.writeBinary(filename, screenshot)

    const links = await page.$$eval('a[href]', (els, base) =>
      els
        .map((a) => {
          try { return new URL(a.href, base).href } catch { return null }
        })
        .filter(Boolean),
      origin
    )

    for (const link of links) {
      if (link.startsWith(origin) && !visited.has(link)) {
        queue.push(link)
      }
    }

    results.push({ url, filename })
  }

  await output.writeJson('sitemap.json', results)

  return { success: true, pages: results.length }
}
