// @name         Twitter Thread Archiver
// @description  Save a full Twitter/X thread as a formatted Markdown file
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   tweetUrl: string - URL of the first tweet in the thread
 */
export default async function run({ page, params, output }) {
  const { tweetUrl } = params

  if (!tweetUrl) throw new Error('Parameter "tweetUrl" is required')

  await page.goto(tweetUrl, { waitUntil: 'networkidle2' })

  await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 })

  const tweets = await page.$$eval('[data-testid="tweet"]', (els) =>
    els.map((el) => ({
      author: el.querySelector('[data-testid="User-Name"]')?.textContent?.trim() ?? '',
      text: el.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? '',
      time: el.querySelector('time')?.getAttribute('datetime') ?? ''
    }))
  )

  const lines = [`# Thread Archive\n`, `Source: ${tweetUrl}\n`, `Archived: ${new Date().toISOString()}\n\n---\n`]
  tweets.forEach((t, i) => {
    lines.push(`## Tweet ${i + 1}`)
    lines.push(`**${t.author}** · ${t.time}\n`)
    lines.push(t.text)
    lines.push('\n---\n')
  })

  await output.writeText('thread.md', lines.join('\n'))

  return { success: true, tweetCount: tweets.length }
}
