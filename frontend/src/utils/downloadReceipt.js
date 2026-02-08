/**
 * Download a receipt PDF. In the Tauri desktop app, saves to the user's
 * Downloads folder and opens it in Preview (macOS) or default app.
 * In the browser, triggers a normal download via a temporary link.
 * @param {Blob} blob - PDF blob from the receipt API
 * @param {string} filename - e.g. "receipt_ORD-2024-01-15-1.pdf"
 * @returns {Promise<boolean>} - true if download/save succeeded
 */
export async function downloadReceiptPdf(blob, filename) {
  if (!blob || !(blob instanceof Blob)) return false
  const isTauri = typeof window !== 'undefined' && window.__TAURI__

  if (isTauri) {
    try {
      const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      await writeFile(filename, bytes, { baseDir: BaseDirectory.Download })
      // Open in Preview (macOS) or default app via Rust command
      try {
        const { downloadDir, join } = await import('@tauri-apps/api/path')
        const { invoke } = await import('@tauri-apps/api/core')
        const dir = await downloadDir()
        const fullPath = await join(dir, filename)
        await invoke('open_receipt_file', { path: fullPath })
      } catch (openErr) {
        console.warn('Could not open receipt in Preview:', openErr)
      }
      return true
    } catch (err) {
      console.error('Tauri receipt save error:', err)
      return false
    }
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    window.URL.revokeObjectURL(url)
    if (a.parentNode) document.body.removeChild(a)
  }, 100)
  return true
}
