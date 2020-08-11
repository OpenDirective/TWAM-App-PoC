if (!process.env.NETLIFY) {
  // use .enc file for local dev and assume netlify variables in CI
  // TODO can this not be run time?
  require('dotenv').config()
}

const fetch = require('node-fetch')

if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
  throw new Error('no GOOGLE_SERVICE_ACCOUNT_EMAIL env var set')
if (!process.env.GOOGLE_PRIVATE_KEY)
  throw new Error('no GOOGLE_PRIVATE_KEY env var set')
if (!process.env.GOOGLE_SPREADSHEET_ID_FROM_URL)
  throw new Error('no GOOGLE_SPREADSHEET_ID_FROM_URL env var set')

const { GoogleSpreadsheet } = require('google-spreadsheet')

exports.handler = async (event, context) => {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID_FROM_URL)

  const {
    user: { email },
  } = context.clientContext

  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
  await doc.loadInfo()

  const sheet = await doc.addSheet()
  const sheetId = sheet.sheetId
  console.log('a')

  const formula = `={{ADDRESS(ROW()+1,COLUMN())&":"&ADDRESS(ROW()+CountA(Filter(INDIRECT("Sheet1!C2:D"&COUNTA(Sheet1!B2:B9999)+1), INDIRECT("Sheet1!B2:B"&COUNTA(Sheet1!B2:B9999)+1)="${email}"))-1,COLUMN()+2-1), "${email}"}; Filter(INDIRECT("Sheet1!C2:D"&COUNTA(Sheet1!B2:B9999)+1), INDIRECT("Sheet1!B2:B"&COUNTA(Sheet1!B2:B9999)+1)="${email}")}`

  try {
    await sheet.loadCells('A1') // Need?
    const cell = sheet.getCell(0, 0)
    cell.formula = formula
    console.log('a')
    await sheet.saveCells([cell])
    const range = cell.value
    await sheet.loadCells(range)
    const dataCells = [...sheet._cells.slice(1, sheet._cells.length)]
    console.log('a')
    const rows = dataCells.map((row) =>
      row.map((c) =>
        c._rawData.formattedValue ? c._rawData.formattedValue : '',
      ),
    )
    console.log('a')

    doc.deleteSheet(sheetId)

    const result = JSON.stringify({ rows })
    return {
      statusCode: 200,
      body: result,
    }
  } catch (err) {
    console.error('error ocurred in processing ', event)
    console.error(err)
    return {
      statusCode: 500,
      body: err.toString(),
    }
  }
}