const { getUserData } = require('./_spreadsheet')

exports.initAppMetadata = async function initRoles(event, context) {
  const { user } = JSON.parse(event.body)
  const { roles: currentRoles, country } = user.app_metadata
  let body = {}

  //TODO only call for twam.uk mail
  const userData = await getUserData(user.email)
  console.log(user.email, userData)
  if (userData) {
    const { roles, country } = userData
    body = {
      body: JSON.stringify({ app_metadata: { roles, country } }),
    }
  } else {
    if (!currentRoles || currentRoles.length == 0) {
      body = {
        body: JSON.stringify({ app_metadata: { roles: ['applicant'] } }),
      }
    }
  }

  return { statusCode: 200, ...body }
}
