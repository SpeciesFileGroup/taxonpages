/**
 * Start the TaxonPages setup web interface.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Path to the TaxonPages framework
 * @param {string} options.projectRoot - Path to the user's project
 * @param {number} options.port - Port number
 */
export async function startSetup({ packageRoot, projectRoot, port }) {
  const { createSetupServer } = await import('../setup/server.js')

  await createSetupServer({
    packageRoot,
    projectRoot,
    port: Number(port)
  })
}
