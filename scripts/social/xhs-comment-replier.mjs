// @name         XHS Comment Replier
// @description  Auto-reply to Xiaohongshu comments using keyword-matched templates
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   noteUrl: string  - URL of the Xiaohongshu post to manage comments on
 *   rules: Array<{ keywords: string[], reply: string }> - Matching rules
 *   dryRun: boolean  - If true, log matched replies without posting (default: true)
 */
export default async function run({ page, params, output }) {
  const { noteUrl, rules = [], dryRun = true } = params

  if (!noteUrl) throw new Error('Parameter "noteUrl" is required')

  await page.goto(noteUrl, { waitUntil: 'networkidle2' })

  const comments = await page.$$eval('.comment-item', (els) =>
    els.map((el) => ({
      id: el.dataset.id ?? '',
      text: el.querySelector('.content')?.textContent?.trim() ?? ''
    }))
  )

  const log = []

  for (const comment of comments) {
    for (const rule of rules) {
      const matched = rule.keywords.some((kw) =>
        comment.text.toLowerCase().includes(kw.toLowerCase())
      )
      if (matched) {
        log.push({ commentId: comment.id, commentText: comment.text, reply: rule.reply })
        if (!dryRun) {
          // Reply logic would go here
        }
        break
      }
    }
  }

  await output.writeJson('reply-log.json', log)

  return { success: true, matched: log.length, total: comments.length, dryRun }
}
