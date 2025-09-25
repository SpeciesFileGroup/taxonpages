export function downloadFile(
  blob,
  filename = null,
  type = 'application/octet-stream'
) {
  const url = window.URL.createObjectURL(new Blob([blob], { type }))
  const link = document.createElement('a')
  link.href = url

  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    filename = `file_${timestamp}`
  }

  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()

  link.parentNode.removeChild(link)
  window.URL.revokeObjectURL(url)
}
