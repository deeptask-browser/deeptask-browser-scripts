// @name         Form Bulk Filler
// @description  Read rows from a CSV file and submit each row as a web form submission
// @version      1.0.0
// @author       deeptask-community
// @type         puppeteer

/**
 * Parameters:
 *   formUrl: string          - URL of the form page to fill
 *   csvPath: string          - Absolute path to the CSV input file
 *   fieldMap: Record<string, string> - Maps CSV column names to CSS selectors
 *   submitSelector: string   - CSS selector of the submit button
 *   delayMs: number          - Delay between submissions in ms (default: 1000)
 */
export default async function run({ page, params, output, fs }) {
  const { formUrl, csvPath, fieldMap = {}, submitSelector = '[type=submit]', delayMs = 1000 } = params

  if (!formUrl) throw new Error('Parameter "formUrl" is required')
  if (!csvPath) throw new Error('Parameter "csvPath" is required')

  const csvContent = await fs.readFile(csvPath, 'utf-8')
  const [headerLine, ...dataLines] = csvContent.trim().split('\n')
  const headers = headerLine.split(',').map((h) => h.trim())
  const rows = dataLines.map((line) => {
    const values = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']))
  })

  const results = []

  for (const [i, row] of rows.entries()) {
    await page.goto(formUrl, { waitUntil: 'domcontentloaded' })

    for (const [col, selector] of Object.entries(fieldMap)) {
      if (row[col] !== undefined) {
        await page.$eval(selector, (el, val) => { el.value = val }, row[col])
      }
    }

    await page.click(submitSelector)
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {})

    results.push({ row: i + 1, status: 'submitted', data: row })

    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  await output.writeJson('submissions.json', results)

  return { success: true, submitted: results.length }
}
